import { prisma } from "@/lib/prisma";

export const getChannelsByUser = async (
    userId: string
) => {
    return prisma.channel.findMany({
        where: {
            userId,
        },
    });
};

export const createChannel = async (
    data: {
        name: string;
        accessToken: string;
        refreshToken: string;
        userId: string;
    }
) => {
    return prisma.channel.create({
        data,
    });
};