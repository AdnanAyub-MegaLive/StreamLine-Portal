import { prisma } from "../../../../lib/prisma";

const allowedOrigin = process.env.MOBILE_APP_ORIGIN || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (body, status = 200) => Response.json(body, { status, headers: corsHeaders });
const cleanOptional = (value) => typeof value === "string" && value.trim() ? value.trim() : null;

function validateRegistration(body) {
  const errors = {};
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (name.length < 2 || name.length > 100) errors.name = "Name must contain 2 to 100 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = "Enter a valid email address.";
  if (body?.phone != null && (typeof body.phone !== "string" || body.phone.trim().length > 30)) errors.phone = "Phone must contain no more than 30 characters.";
  if (body?.country != null && (typeof body.country !== "string" || body.country.trim().length > 100)) errors.country = "Country must contain no more than 100 characters.";
  if (body?.profileImage != null && (typeof body.profileImage !== "string" || body.profileImage.length > 2048)) errors.profileImage = "Profile image must be a URL no longer than 2048 characters.";

  const device = body?.device;
  if (device != null && (typeof device !== "object" || Array.isArray(device))) errors.device = "Device must be an object.";
  if (device && (typeof device.macAddress !== "string" || !device.macAddress.trim())) errors["device.macAddress"] = "MAC address or a stable device identifier is required when device information is supplied.";

  return { errors, values: { name, email } };
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, 400);
  }

  const { errors, values } = validateRegistration(body);
  if (Object.keys(errors).length) {
    return json({ success: false, error: { code: "VALIDATION_ERROR", message: "Registration data is invalid.", fields: errors } }, 422);
  }

  const publicId = `USR-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          publicId,
          name: values.name,
          email: values.email,
          phone: cleanOptional(body.phone),
          country: cleanOptional(body.country),
          profileImage: cleanOptional(body.profileImage),
          role: "LISTENER",
          status: "ACTIVE",
          devices: body.device ? {
            create: {
              macAddress: body.device.macAddress.trim(),
              lastLoginIp: cleanOptional(body.device.lastLoginIp) || ipAddress,
              location: cleanOptional(body.device.location),
              platform: cleanOptional(body.device.platform),
              deviceName: cleanOptional(body.device.deviceName),
              lastLoginAt: new Date(),
            },
          } : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "USER_REGISTERED",
          category: "USER_MANAGEMENT",
          entityType: "User",
          entityId: created.publicId,
          description: `User ${created.publicId} registered through the mobile application`,
          ipAddress,
          metadata: { source: "MOBILE_APP", email: created.email },
        },
      });
      return created;
    });

    return json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: {
          id: user.publicId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          country: user.country,
          profileImage: user.profileImage,
          role: user.role,
          status: user.status,
          vipLevel: user.vipLevel,
          createdAt: user.createdAt.toISOString(),
        },
      },
    }, 201);
  } catch (error) {
    if (error?.code === "P2002") {
      return json({ success: false, error: { code: "EMAIL_ALREADY_REGISTERED", message: "A user with this email address already exists." } }, 409);
    }
    console.error("User registration failed", error);
    return json({ success: false, error: { code: "REGISTRATION_FAILED", message: "Unable to register the user right now." } }, 500);
  }
}
