import { PrismaClient, User } from "@prisma/client";
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
    return this.prisma.user.create({ data });
  }

  async update(
    id: number,
    data: { email?: string; name?: string },
  ): Promise<User> {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
