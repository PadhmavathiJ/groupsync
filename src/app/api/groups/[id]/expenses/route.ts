import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";

type CustomSplitInput = {
  userId: string;
  amount: number;
};

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  await connectDB();

  return User.findOne({
    email: session.user.email.toLowerCase(),
  });
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return Response.json(
        { message: "Invalid group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(id);

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (memberId: mongoose.Types.ObjectId) =>
        memberId.toString() ===
        currentUser._id.toString()
    );

    if (!isMember) {
      return Response.json(
        {
          message:
            "You are not a member of this group",
        },
        { status: 403 }
      );
    }

    const expenses = await Expense.find({
      groupId: id,
    })
      .populate("paidBy", "name email avatar")
      .populate(
        "participants",
        "name email avatar"
      )
      .populate(
        "splits.userId",
        "name email avatar"
      )
      .sort({ createdAt: -1 });

    return Response.json({ expenses });
  } catch (error) {
    console.error(
      "Failed to load expenses:",
      error
    );

    return Response.json(
      { message: "Failed to load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return Response.json(
        { message: "Invalid group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(id);

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (memberId: mongoose.Types.ObjectId) =>
        memberId.toString() ===
        currentUser._id.toString()
    );

    if (!isMember) {
      return Response.json(
        {
          message:
            "You are not a member of this group",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const amount = Number(body.amount);

    const paidBy =
      typeof body.paidBy === "string"
        ? body.paidBy
        : "";

    const participants: string[] =
      Array.isArray(body.participants)
        ? body.participants
        : [];

    const splitType =
      body.splitType === "CUSTOM"
        ? "CUSTOM"
        : "EQUAL";

    if (!description) {
      return Response.json(
        {
          message:
            "Expense description is required",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return Response.json(
        {
          message:
            "Expense amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.isValidObjectId(paidBy)
    ) {
      return Response.json(
        { message: "Invalid payer" },
        { status: 400 }
      );
    }

    if (participants.length === 0) {
      return Response.json(
        {
          message:
            "Select at least one participant",
        },
        { status: 400 }
      );
    }

    const groupMemberIds = new Set(
      group.members.map(
        (
          memberId: mongoose.Types.ObjectId
        ) => memberId.toString()
      )
    );

    if (!groupMemberIds.has(paidBy)) {
      return Response.json(
        {
          message:
            "Payer must belong to this group",
        },
        { status: 400 }
      );
    }

    const invalidParticipant =
      participants.some(
        (participantId) =>
          !mongoose.isValidObjectId(
            participantId
          ) ||
          !groupMemberIds.has(
            participantId
          )
      );

    if (invalidParticipant) {
      return Response.json(
        {
          message:
            "Every participant must belong to this group",
        },
        { status: 400 }
      );
    }

    const uniqueParticipants = [
      ...new Set(participants),
    ];

    let splits: {
      userId: string;
      amount: number;
    }[] = [];

    const totalPaise = Math.round(
      amount * 100
    );

    if (splitType === "EQUAL") {
      const baseShare = Math.floor(
        totalPaise /
          uniqueParticipants.length
      );

      const remainder =
        totalPaise -
        baseShare *
          uniqueParticipants.length;

      splits = uniqueParticipants.map(
        (userId, index) => ({
          userId,
          amount:
            (baseShare +
              (index < remainder
                ? 1
                : 0)) /
            100,
        })
      );
    } else {
      const customSplits: CustomSplitInput[] =
        Array.isArray(body.customSplits)
          ? body.customSplits
          : [];

      if (
        customSplits.length !==
        uniqueParticipants.length
      ) {
        return Response.json(
          {
            message:
              "Enter a custom split for every participant",
          },
          { status: 400 }
        );
      }

      const customMap = new Map(
        customSplits.map((split) => [
          split.userId,
          Number(split.amount),
        ])
      );

      const customTotalPaise =
        uniqueParticipants.reduce(
          (sum, userId) => {
            const splitAmount =
              customMap.get(userId);

            if (
              splitAmount === undefined ||
              !Number.isFinite(
                splitAmount
              ) ||
              splitAmount < 0
            ) {
              return Number.NaN;
            }

            return (
              sum +
              Math.round(
                splitAmount * 100
              )
            );
          },
          0
        );

      if (
        !Number.isFinite(
          customTotalPaise
        ) ||
        customTotalPaise !==
          totalPaise
      ) {
        return Response.json(
          {
            message:
              "Custom split amounts must exactly equal the expense total",
          },
          { status: 400 }
        );
      }

      splits = uniqueParticipants.map(
        (userId) => ({
          userId,
          amount:
            Math.round(
              Number(
                customMap.get(userId)
              ) * 100
            ) / 100,
        })
      );
    }

    const expense = await Expense.create({
      groupId: id,
      description,
      amount:
        Math.round(amount * 100) / 100,
      paidBy,
      participants:
        uniqueParticipants,
      splits,
      splitType,
    });

    await expense.populate(
      "paidBy",
      "name email avatar"
    );

    await expense.populate(
      "participants",
      "name email avatar"
    );

    await expense.populate(
      "splits.userId",
      "name email avatar"
    );

    return Response.json(
      { expense },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create expense:",
      error
    );

    return Response.json(
      {
        message:
          "Failed to create expense",
      },
      { status: 500 }
    );
  }
}