import type { Response } from "express";

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
) => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
  });
};