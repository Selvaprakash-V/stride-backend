import Session from "../models/Session.js";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Search users by name, firstName, lastName, or email (case-insensitive)
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { name: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("firstName lastName name email profileImage clerkId")
      .limit(10);

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error in searchUsers controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMe(req, res) {
  try {
    const user = req.user; // attached by protectRoute

    // basic stats about user's work/sessions
    const [hostedCount, participantCount, completedHostedCount, completedParticipantCount] =
      await Promise.all([
        Session.countDocuments({ host: user._id }),
        Session.countDocuments({ participant: user._id }),
        Session.countDocuments({ host: user._id, status: "completed" }),
        Session.countDocuments({ participant: user._id, status: "completed" }),
      ]);

    res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        clerkId: user.clerkId,
        role: user.role,
        createdAt: user.createdAt,
      },
      stats: {
        hostedSessions: hostedCount,
        participatedSessions: participantCount,
        completedHostedSessions: completedHostedCount,
        completedParticipatedSessions: completedParticipantCount,
      },
    });
  } catch (error) {
    console.error("Error in getMe controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateMe(req, res) {
  try {
    const authUser = req.user; // attached by protectRoute
    const { role } = req.body;

    const allowedRoles = ["host", "participant"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(authUser._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role) {
      user.role = role;
    }

    await user.save();

    res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        clerkId: user.clerkId,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in updateMe controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Sync all users from Clerk to update their names and emails
export async function syncAllUsersFromClerk(req, res) {
  try {
    if (!ENV.CLERK_SECRET_KEY) {
      return res.status(500).json({ message: "Clerk secret key not configured" });
    }

    // Get all users from MongoDB
    const dbUsers = await User.find({});
    
    let updatedCount = 0;
    let errors = [];

    for (const dbUser of dbUsers) {
      try {
        // Fetch user data from Clerk API
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${dbUser.clerkId}`, {
          headers: {
            Authorization: `Bearer ${ENV.CLERK_SECRET_KEY}`,
          },
        });

        if (!clerkResponse.ok) {
          errors.push(`Failed to fetch Clerk user ${dbUser.clerkId}`);
          continue;
        }

        const clerkUser = await clerkResponse.json();

        // Update user with Clerk data
        const firstName = clerkUser.first_name || "";
        const lastName = clerkUser.last_name || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ");
        const email = clerkUser.email_addresses?.[0]?.email_address || dbUser.email;
        const profileImage = clerkUser.image_url || "";

        let needsUpdate = false;

        if (firstName && dbUser.firstName !== firstName) {
          dbUser.firstName = firstName;
          needsUpdate = true;
        }
        if (lastName !== undefined && dbUser.lastName !== lastName) {
          dbUser.lastName = lastName;
          needsUpdate = true;
        }
        if (fullName && dbUser.name !== fullName) {
          dbUser.name = fullName;
          needsUpdate = true;
        }
        if (email && dbUser.email !== email && !email.includes("@example.com")) {
          dbUser.email = email;
          needsUpdate = true;
        }
        if (profileImage && dbUser.profileImage !== profileImage) {
          dbUser.profileImage = profileImage;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await dbUser.save();
          updatedCount++;
        }
      } catch (err) {
        errors.push(`Error updating user ${dbUser.clerkId}: ${err.message}`);
      }
    }

    res.status(200).json({
      message: `Synced ${updatedCount} users from Clerk`,
      totalUsers: dbUsers.length,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in syncAllUsersFromClerk:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
