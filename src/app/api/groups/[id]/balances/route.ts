import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email.toLowerCase(),
    });

    if (!currentUser) {
      return Response.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return Response.json(
        { message: "Invalid group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(id).populate(
      "members",
      "name email avatar"
    );

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (member: {
        _id: mongoose.Types.ObjectId;
      }) =>
        member._id.toString() ===
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
    });

    const balanceMap = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        avatar?: string;
        paid: number;
        owed: number;
        balance: number;
      }
    >();

    for (const member of group.members as {
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      avatar?: string;
    }[]) {
      balanceMap.set(member._id.toString(), {
        userId: member._id.toString(),
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        paid: 0,
        owed: 0,
        balance: 0,
      });
    }

    for (const expense of expenses) {
      const payerId =
        expense.paidBy.toString();

      const payer = balanceMap.get(payerId);

      if (payer) {
        payer.paid += expense.amount;
      }

      for (const split of expense.splits) {
        const userId =
          split.userId.toString();

        const member =
          balanceMap.get(userId);

        if (member) {
          member.owed += split.amount;
        }
      }
    }

    const balances = Array.from(
      balanceMap.values()
    ).map((member) => {
      const paid =
        Math.round(member.paid * 100) / 100;

      const owed =
        Math.round(member.owed * 100) / 100;

      const balance =
        Math.round((paid - owed) * 100) /
        100;

      return {
        ...member,
        paid,
        owed,
        balance,
      };
    });

    const creditors = balances
  .filter((member) => member.balance > 0)
  .map((member) => ({
    userId: member.userId,
    name: member.name,
    amount: member.balance,
  }))
  .sort((a, b) => b.amount - a.amount);

const debtors = balances
  .filter((member) => member.balance < 0)
  .map((member) => ({
    userId: member.userId,
    name: member.name,
    amount: Math.abs(member.balance),
  }))
  .sort((a, b) => b.amount - a.amount);

const settlements: {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}[] = [];

let debtorIndex = 0;
let creditorIndex = 0;

while (
  debtorIndex < debtors.length &&
  creditorIndex < creditors.length
) {
  const debtor = debtors[debtorIndex];
  const creditor = creditors[creditorIndex];

  const amount = Math.min(
    debtor.amount,
    creditor.amount
  );

  const roundedAmount =
    Math.round(amount * 100) / 100;

  if (roundedAmount > 0) {
    settlements.push({
      fromUserId: debtor.userId,
      fromName: debtor.name,
      toUserId: creditor.userId,
      toName: creditor.name,
      amount: roundedAmount,
    });
  }

  debtor.amount =
    Math.round(
      (debtor.amount - roundedAmount) * 100
    ) / 100;

  creditor.amount =
    Math.round(
      (creditor.amount - roundedAmount) * 100
    ) / 100;

  if (debtor.amount === 0) {
    debtorIndex++;
  }

  if (creditor.amount === 0) {
    creditorIndex++;
  }
}

return Response.json({
  balances,
  settlements,
});
  } catch (error) {
    console.error(
      "Failed to calculate balances:",
      error
    );

    return Response.json(
      {
        message:
          "Failed to calculate balances",
      },
      { status: 500 }
    );
  }
}