import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAll = async () => {
  return await prisma.category.findMany();
};

export const getById = async (id: string) => {
  return await prisma.category.findUnique({
    where: { category_id: id },
  });
};

export const create = async (data: any) => {
  return await prisma.category.create({ data });
};

export const update = async (id: string, data: any) => {
  return await prisma.category.update({
    where: { category_id: id },
    data,
  });
};

export const remove = async (id: string) => {
  return await prisma.category.delete({
    where: { category_id: id },
  });
};
