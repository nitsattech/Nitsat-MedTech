import { NextResponse } from "next/server";

export async function GET() {
  // 🔥 Direct dummy doctors (no DB needed)
  const doctors = [
    {
      id: 1,
      name: "Ajay Sharma",
      specialization: "Cardiology",
      qualification: "MD"
    },
    {
      id: 2,
      name: "Priya Singh",
      specialization: "Neurology",
      qualification: "MBBS, MD"
    },
    {
      id: 3,
      name: "Rahul Verma",
      specialization: "Orthopedics",
      qualification: "MS Ortho"
    },
    {
      id: 4,
      name: "Neha Gupta",
      specialization: "General Physician",
      qualification: "MBBS"
    }
  ];

  return NextResponse.json(doctors);
}