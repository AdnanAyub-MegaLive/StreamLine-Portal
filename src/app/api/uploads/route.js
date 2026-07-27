import { auth } from "../../../../auth";
import { prisma } from "../../../lib/prisma";
import {
  serializeUploadAsset,
  validUploadCategories,
} from "../../../lib/upload-assets";

const allowedTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);
const maxFileSize = 15 * 1024 * 1024;
const assignmentInclude = {
  assignments: {
    include: {
      user: { select: { publicId: true, name: true, profileImage: true } },
    },
    orderBy: { assignedAt: "asc" },
  },
};

function publicIds(value) {
  const values = Array.isArray(value) ? value : [];
  return [
    ...new Set(values.map((item) => String(item).trim()).filter(Boolean)),
  ].slice(0, 1000);
}

function cleanTags(value) {
  const values = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))]
    .slice(0, 20)
    .map((item) => item.slice(0, 40));
}

async function resolveUsers(client, ids) {
  if (!ids.length) return [];
  const users = await client.user.findMany({
    where: { publicId: { in: ids }, deletedAt: null },
    select: { id: true, publicId: true },
  });
  if (users.length !== ids.length) {
    const error = new Error("One or more selected users no longer exist.");
    error.code = "USER_NOT_FOUND";
    throw error;
  }
  return users;
}

function parseGrants(value, fallbackIds = [], fallbackMinutes = 10080) {
  const values = Array.isArray(value)
    ? value
    : fallbackIds.map((userId) => ({
        userId,
        durationMinutes: fallbackMinutes,
      }));
  const unique = new Map();
  for (const item of values) {
    const userId = String(item?.userId ?? "").trim();
    const durationMinutes = Number(item?.durationMinutes);
    const suppliedExpiry = item?.expiresAt ? new Date(item.expiresAt) : null;
    if (!userId) continue;
    if (suppliedExpiry && !Number.isNaN(suppliedExpiry.getTime()))
      unique.set(userId, {
        userId,
        durationMinutes:
          Number.isInteger(durationMinutes) && durationMinutes > 0
            ? durationMinutes
            : null,
        expiresAt: suppliedExpiry,
      });
    else if (
      Number.isInteger(durationMinutes) &&
      durationMinutes > 0 &&
      durationMinutes <= 5256000
    )
      unique.set(userId, {
        userId,
        durationMinutes,
        expiresAt: new Date(Date.now() + durationMinutes * 60000),
      });
  }
  return [...unique.values()].slice(0, 1000);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Administrator authentication is required.",
        },
      },
      { status: 401 },
    );
  try {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const details =
      String(form.get("details") ?? "")
        .trim()
        .slice(0, 2000) || null;
    let tags = [];
    try {
      tags = cleanTags(JSON.parse(String(form.get("tags") ?? "[]")));
    } catch {
      tags = cleanTags(form.get("tags"));
    }
    const category = String(form.get("category") ?? "");
    let selectedIds = [];
    try {
      selectedIds = publicIds(
        JSON.parse(String(form.get("assignedUserIds") ?? "[]")),
      );
    } catch {
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Assigned users must be a valid list.",
          },
        },
        { status: 422 },
      );
    }
    const assignmentMinutes = Number(
      form.get("assignmentDurationMinutes") ?? 10080,
    );
    const grants = parseGrants(null, selectedIds, assignmentMinutes);
    if (selectedIds.length && grants.length !== selectedIds.length)
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid assignment time period is required.",
          },
        },
        { status: 422 },
      );
    const isRoomBackground =
      form.get("isRoomBackground") === "true" ||
      category === "ROOM_BACKGROUNDS";
    const file = form.get("file");
    if (!name || name.length > 80)
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name must contain 1 to 80 characters.",
          },
        },
        { status: 422 },
      );
    if (!validUploadCategories.has(category))
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Upload category is invalid.",
          },
        },
        { status: 422 },
      );
    if (!(file instanceof File) || !file.size)
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A media file is required.",
          },
        },
        { status: 422 },
      );
    if (!allowedTypes.has(file.type))
      return Response.json(
        {
          success: false,
          error: {
            code: "UNSUPPORTED_MEDIA_TYPE",
            message:
              "Only PNG, JPG, WEBP, GIF, MP4, and WEBM files are supported.",
          },
        },
        { status: 415 },
      );
    if (file.size > maxFileSize)
      return Response.json(
        {
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: "Files cannot exceed 15 MB.",
          },
        },
        { status: 413 },
      );
    const users = await resolveUsers(prisma, selectedIds);
    const publicId = `AST-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const asset = await prisma.$transaction(async (tx) => {
      const created = await tx.uploadAsset.create({
        data: {
          publicId,
          name,
          details,
          tags,
          category,
          fileName: file.name.slice(0, 255),
          mimeType: file.type,
          fileSize: file.size,
          fileData: bytes,
          isGlobal: users.length === 0,
          isRoomBackground,
        },
      });
      if (users.length)
        await tx.uploadAssetAssignment.createMany({
          data: users.map((user) => {
            const grant = grants.find((item) => item.userId === user.publicId);
            return {
              assetId: created.id,
              userId: user.id,
              durationMinutes: grant.durationMinutes,
              expiresAt: grant.expiresAt,
            };
          }),
        });
      await tx.auditLog.create({
        data: {
          action: "UPLOAD_ASSET_CREATED",
          category: "CONTENT_MANAGEMENT",
          entityType: "UploadAsset",
          entityId: publicId,
          description: `${session.user.name ?? "Administrator"} uploaded ${name} to ${category} and assigned it to ${users.length} user(s).`,
          metadata: {
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            assignedUserIds: selectedIds,
            isRoomBackground,
          },
        },
      });
      return tx.uploadAsset.findUniqueOrThrow({
        where: { id: created.id },
        include: assignmentInclude,
      });
    });
    return Response.json(
      {
        success: true,
        data: {
          asset: serializeUploadAsset(
            asset,
            `/api/uploads/${asset.publicId}/file`,
          ),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error?.code === "USER_NOT_FOUND")
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 404 },
      );
    console.error("Asset upload failed", error);
    return Response.json(
      {
        success: false,
        error: {
          code: "UPLOAD_FAILED",
          message: "Unable to store this upload right now.",
        },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Administrator authentication is required.",
        },
      },
      { status: 401 },
    );
  try {
    const body = await request.json();
    const assetId = String(body?.assetId ?? "");
    const updatesAssignments =
      Array.isArray(body?.assignmentGrants) ||
      Array.isArray(body?.assignedUserIds);
    const grants = Array.isArray(body?.assignmentGrants)
      ? parseGrants(body.assignmentGrants)
      : parseGrants(
          null,
          publicIds(body?.assignedUserIds),
          Number(body?.assignmentDurationMinutes ?? 10080),
        );
    const selectedIds = updatesAssignments
      ? grants.map((grant) => grant.userId)
      : [];
    if (
      updatesAssignments &&
      Array.isArray(body?.assignedUserIds) &&
      selectedIds.length !== publicIds(body.assignedUserIds).length
    )
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid assignment time period is required.",
          },
        },
        { status: 422 },
      );
    const users = updatesAssignments
      ? await resolveUsers(prisma, selectedIds)
      : [];
    const asset = await prisma.$transaction(async (tx) => {
      const current = await tx.uploadAsset.findUniqueOrThrow({
        where: { publicId: assetId },
        select: { id: true, name: true },
      });
      if (updatesAssignments) {
        await tx.uploadAssetAssignment.deleteMany({
          where: { assetId: current.id },
        });
        if (users.length)
          await tx.uploadAssetAssignment.createMany({
            data: users.map((user) => {
              const grant = grants.find(
                (item) => item.userId === user.publicId,
              );
              return {
                assetId: current.id,
                userId: user.id,
                durationMinutes: grant.durationMinutes,
                expiresAt: grant.expiresAt,
              };
            }),
          });
      }
      const name =
        typeof body?.name === "string" ? body.name.trim() : undefined;
      if (name !== undefined && (!name || name.length > 80)) {
        const error = new Error("Name must contain 1 to 80 characters.");
        error.code = "VALIDATION_ERROR";
        throw error;
      }
      await tx.uploadAsset.update({
        where: { id: current.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(typeof body?.details === "string" || body?.details === null
            ? {
                details:
                  String(body.details ?? "")
                    .trim()
                    .slice(0, 2000) || null,
              }
            : {}),
          ...(Array.isArray(body?.tags) ? { tags: cleanTags(body.tags) } : {}),
          ...(updatesAssignments ? { isGlobal: false } : {}),
          ...(typeof body?.isRoomBackground === "boolean"
            ? { isRoomBackground: body.isRoomBackground }
            : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          action: "UPLOAD_ASSET_UPDATED",
          category: "CONTENT_MANAGEMENT",
          entityType: "UploadAsset",
          entityId: assetId,
          description: `${session.user.name ?? "Administrator"} updated ${name ?? current.name}${updatesAssignments ? ` and assigned it to ${users.length} user(s)` : ``}.`,
          metadata: {
            ...(updatesAssignments ? { assignedUserIds: selectedIds } : {}),
            isRoomBackground: body?.isRoomBackground,
          },
        },
      });
      return tx.uploadAsset.findUniqueOrThrow({
        where: { id: current.id },
        include: assignmentInclude,
      });
    });
    return Response.json({
      success: true,
      data: {
        asset: serializeUploadAsset(
          asset,
          `/api/uploads/${asset.publicId}/file`,
        ),
      },
    });
  } catch (error) {
    if (error?.code === "VALIDATION_ERROR")
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 422 },
      );
    if (error?.code === "P2025")
      return Response.json(
        {
          success: false,
          error: { code: "ASSET_NOT_FOUND", message: "Upload not found." },
        },
        { status: 404 },
      );
    if (error?.code === "USER_NOT_FOUND")
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 404 },
      );
    console.error("Asset assignment update failed", error);
    return Response.json(
      {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: "Unable to update this upload right now.",
        },
      },
      { status: 500 },
    );
  }
}
