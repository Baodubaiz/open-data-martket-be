// services/user.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lấy tất cả user
export const getAll = async () => {
  return await prisma.user.findMany();
};

// Lấy user theo user_id
export const getById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { user_id: id }, // 🔑 sửa lại theo schema
  });
};

// Tạo user mới
export const create = async (data: any) => {
  return await prisma.user.create({
    data,
  });
};

// Cập nhật user theo user_id
export const update = async (id: string, data: any) => {
  return await prisma.user.update({
    where: { user_id: id }, // 🔑 sửa lại theo schema
    data,
  });
};

// Xóa user theo user_id
export const remove = async (id: string) => {
  return await prisma.user.delete({
    where: { user_id: id }, // 🔑 sửa lại theo schema
  });
};
