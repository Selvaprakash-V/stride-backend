import { requireAuth } from "@clerk/express";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const { userId, sessionClaims } = req.auth();
      const clerkId = userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // Get user data from Clerk session
      const givenName = sessionClaims?.given_name || "";
      const familyName = sessionClaims?.family_name || "";
      const fullName = [givenName, familyName].filter(Boolean).join(" ");
      const emailFromClaims =
        sessionClaims?.email ||
        sessionClaims?.email_address ||
        sessionClaims?.email_addresses?.[0]?.email_address;
      const profileImageFromClaims = sessionClaims?.image_url || "";

      // Try to find existing user by Clerk ID
      let user = await User.findOne({ clerkId });

      // Auto-create user in MongoDB on first authenticated request if missing
      if (!user) {
        user = await User.create({
          clerkId,
          firstName: givenName || "User",
          lastName: familyName,
          name: fullName || "User",
          email: emailFromClaims || `${clerkId}@example.com`,
          profileImage: profileImageFromClaims,
        });
      } else {
        // Update existing user with latest Clerk data if it has changed
        let needsUpdate = false;
        
        if (givenName && user.firstName !== givenName) {
          user.firstName = givenName;
          needsUpdate = true;
        }
        if (familyName && user.lastName !== familyName) {
          user.lastName = familyName;
          needsUpdate = true;
        }
        if (fullName && user.name !== fullName) {
          user.name = fullName;
          needsUpdate = true;
        }
        if (emailFromClaims && user.email !== emailFromClaims && !emailFromClaims.includes("@example.com")) {
          user.email = emailFromClaims;
          needsUpdate = true;
        }
        if (profileImageFromClaims && user.profileImage !== profileImageFromClaims) {
          user.profileImage = profileImageFromClaims;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await user.save();
        }
      }

      // attach user to req
      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
