import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lấy tất cả tag
export const getAll = async () => {
  return await prisma.tag.findMany();
};

// Lấy tag theo id
export const getById = async (id: string) => {
  return await prisma.tag.findUnique({
    where: { tag_id: id },
  });
};

// Tạo tag
export const create = async (data: any) => {
  return await prisma.tag.create({ data });
};

// Cập nhật tag
export const update = async (id: string, data: any) => {
  return await prisma.tag.update({
    where: { tag_id: id },
    data,
  });
};

// Xóa tag
export const remove = async (id: string) => {
  return await prisma.tag.delete({
    where: { tag_id: id },
  });
};
