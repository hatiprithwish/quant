import { DrizzleDb } from "../db";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import {
  CreateMoneyCategoryRepoRequest,
  UpdateMoneyCategoryRepoRequest,
  GetMoneyCategoriesResponse,
  CreateMoneyCategoryResponse,
  UpdateMoneyCategoryResponse,
  DeleteMoneyCategoryResponse,
  MoneyCategoryItem,
  MoneyCategoryTypeEnum,
} from "../schemas";

export class MoneyCategoryRepo {
  static async getCategories(
    userId: string,
    db: DrizzleDb,
  ): Promise<GetMoneyCategoriesResponse> {
    const rows = await MoneyCategoryDAL.findAll(userId, db);
    return {
      isSuccess: true,
      message: "Categories retrieved",
      categories: rows.map(toItem),
    };
  }

  static async getCategoriesByType(
    userId: string,
    type: MoneyCategoryTypeEnum,
    db: DrizzleDb,
  ): Promise<MoneyCategoryItem[]> {
    const rows = await MoneyCategoryDAL.findByType(userId, type, db);
    return rows.map(toItem);
  }

  static async createCategory(
    req: CreateMoneyCategoryRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateMoneyCategoryResponse> {
    const row = await MoneyCategoryDAL.insert(
      {
        userId: req.userId,
        name: req.name,
        display_label: req.display_label,
        color: req.color,
        type: req.type,
      },
      db,
    );
    return { isSuccess: true, message: "Category created", category: toItem(row) };
  }

  static async updateCategory(
    req: UpdateMoneyCategoryRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateMoneyCategoryResponse> {
    const existing = await MoneyCategoryDAL.findById(req.id, req.userId, db);
    if (!existing) return { isSuccess: false, message: "Category not found", category: null as never };

    const row = await MoneyCategoryDAL.update(
      req.id,
      req.userId,
      { display_label: req.display_label, color: req.color },
      db,
    );
    return { isSuccess: true, message: "Category updated", category: toItem(row!) };
  }

  static async deleteCategory(
    id: number,
    userId: string,
    db: DrizzleDb,
  ): Promise<DeleteMoneyCategoryResponse> {
    const existing = await MoneyCategoryDAL.findById(id, userId, db);
    if (!existing) return { isSuccess: false, message: "Category not found" };
    if (existing.deleted_at) return { isSuccess: false, message: "Category not found" };

    const [inExpense, inDeposit, inBudget, inRecurring] = await Promise.all([
      MoneyCategoryDAL.isUsedByExpense(id, db),
      MoneyCategoryDAL.isUsedByDeposit(id, db),
      MoneyCategoryDAL.isUsedByBudget(id, db),
      MoneyCategoryDAL.isUsedByRecurring(id, db),
    ]);

    if (inExpense || inDeposit || inBudget || inRecurring) {
      return { isSuccess: false, message: "Category is in use and cannot be deleted" };
    }

    await MoneyCategoryDAL.softDelete(id, userId, db);
    return { isSuccess: true, message: "Category deleted" };
  }
}

function toItem(row: {
  id: number;
  name: string;
  display_label: string;
  color: string;
  type: string;
}): MoneyCategoryItem {
  return {
    id: row.id,
    name: row.name,
    display_label: row.display_label,
    color: row.color,
    type: row.type as MoneyCategoryTypeEnum,
  };
}
