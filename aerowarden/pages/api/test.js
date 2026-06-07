import connectDB from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    await connectDB();

    res.status(200).json({
      success: true,
      message: "Conectado a MongoDB",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}