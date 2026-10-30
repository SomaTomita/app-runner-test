import { Prisma, PrismaClient, User } from "../generated/prisma/client";
import { AppError } from "../lib/errors";

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, "User not found");
    }
    return user;
  }

  async create(data: { email: string; name: string }): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new AppError(409, "Email already exists");
      }
      throw err;
    }
  }

  async update(
    id: number,
    data: { email?: string; name?: string },
  ): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new AppError(409, "Email already exists");
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new AppError(404, "User not found");
      }
      throw err;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new AppError(404, "User not found");
      }
      throw err;
    }
  }
}
