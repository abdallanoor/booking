import { NextResponse } from "next/server";

export function successResponse(
  data: unknown,
  message?: string,
  status: number = 200
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  status: number = 400,
  errors?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}
