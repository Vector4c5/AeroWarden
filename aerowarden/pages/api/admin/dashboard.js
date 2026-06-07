import { getServerSession } from "next-auth/next";

import { authOptions } from "../../../lib/authOptions";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/users";
import Hangar from "../../../models/hangars";
import Aircraft from "../../../models/aircraft";

function isAdminSession(session) {
  return session?.user?.role === "admin";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método no permitido",
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!isAdminSession(session)) {
      return res.status(401).json({
        error: "No autorizado",
      });
    }

    await connectDB();

    const [usersCount, hangarsCount, aircraftCount, reportsResult] =
      await Promise.all([
        User.countDocuments(),
        Hangar.countDocuments(),
        Aircraft.countDocuments(),
        Aircraft.aggregate([
          {
            $project: {
              reportCount: {
                $size: {
                  $ifNull: ["$reports", []],
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalReports: {
                $sum: "$reportCount",
              },
            },
          },
        ]),
      ]);

    const [statusBreakdown, recentHangars, recentAircraft] = await Promise.all([
      Aircraft.aggregate([
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),
      Hangar.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("owner", "name email")
        .lean(),
      Aircraft.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("hangar", "name location")
        .populate("owner", "name email")
        .lean(),
    ]);

    return res.status(200).json({
      stats: {
        usersCount,
        hangarsCount,
        aircraftCount,
        reportsCount: reportsResult[0]?.totalReports || 0,
      },
      statusBreakdown,
      recentHangars,
      recentAircraft,
    });
  } catch (error) {
    console.error("ERROR EN DASHBOARD ADMIN:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
}
