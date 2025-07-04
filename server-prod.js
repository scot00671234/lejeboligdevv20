var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/prod.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  favorites: () => favorites,
  favoritesRelations: () => favoritesRelations,
  insertFavoriteSchema: () => insertFavoriteSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertPropertySchema: () => insertPropertySchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  properties: () => properties,
  propertiesRelations: () => propertiesRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  // 'tenant' or 'landlord'
  phone: text("phone"),
  profilePictureUrl: text("profile_picture_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow()
});
var properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  postalCode: text("postal_code"),
  city: text("city"),
  country: text("country").default("Denmark"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  rooms: integer("rooms").notNull(),
  size: integer("size").notNull(),
  // in square meters
  available: boolean("available").default(true),
  availableFrom: timestamp("available_from"),
  images: text("images").array(),
  createdAt: timestamp("created_at").defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  propertyId: integer("property_id").references(() => properties.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  favorites: many(favorites)
}));
var propertiesRelations = relations(properties, ({ one, many }) => ({
  landlord: one(users, {
    fields: [properties.landlordId],
    references: [users.id]
  }),
  messages: many(messages),
  favorites: many(favorites)
}));
var messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "sentMessages"
  }),
  toUser: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "receivedMessages"
  }),
  property: one(properties, {
    fields: [messages.propertyId],
    references: [properties.id]
  })
}));
var favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id]
  }),
  property: one(properties, {
    fields: [favorites.propertyId],
    references: [properties.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true
});
var insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, or, ilike, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updateData) {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }
  // Property methods
  async getProperties(filters) {
    const conditions = [eq(properties.available, true)];
    if (filters?.location) {
      conditions.push(ilike(properties.address, `%${filters.location}%`));
    }
    if (filters?.rooms) {
      conditions.push(eq(properties.rooms, filters.rooms));
    }
    if (filters?.maxPrice) {
      conditions.push(eq(properties.price, filters.maxPrice.toString()));
    }
    if (filters?.landlordId) {
      conditions.push(eq(properties.landlordId, filters.landlordId));
    }
    return await db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.createdAt));
  }
  async getProperty(id) {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || void 0;
  }
  async createProperty(insertProperty) {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }
  async updateProperty(id, updateData) {
    const [property] = await db.update(properties).set(updateData).where(eq(properties.id, id)).returning();
    return property || void 0;
  }
  async deleteProperty(id) {
    const result = await db.delete(properties).where(eq(properties.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Message methods
  async getMessages(userId, otherUserId) {
    const conditions = otherUserId ? or(
      and(eq(messages.fromUserId, userId), eq(messages.toUserId, otherUserId)),
      and(eq(messages.fromUserId, otherUserId), eq(messages.toUserId, userId))
    ) : or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId));
    return await db.select().from(messages).where(conditions).orderBy(desc(messages.createdAt));
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  async markMessageAsRead(id) {
    const result = await db.update(messages).set({ read: true }).where(eq(messages.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Favorite methods
  async getFavorites(userId) {
    const result = await db.select({
      id: favorites.id,
      userId: favorites.userId,
      propertyId: favorites.propertyId,
      createdAt: favorites.createdAt,
      property: properties
    }).from(favorites).innerJoin(properties, eq(favorites.propertyId, properties.id)).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
    return result;
  }
  async addFavorite(insertFavorite) {
    const [favorite] = await db.insert(favorites).values(insertFavorite).returning();
    return favorite;
  }
  async removeFavorite(userId, propertyId) {
    const result = await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return (result.rowCount || 0) > 0;
  }
  async isFavorite(userId, propertyId) {
    const [favorite] = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return !!favorite;
  }
};
var storage = new DatabaseStorage();

// server/config.ts
var config = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || (() => {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  })(),
  // JWT Secret
  JWT_SECRET: process.env.JWT_SECRET || "development-jwt-secret-key-change-in-production-32-chars-min",
  // Session Secret
  SESSION_SECRET: process.env.SESSION_SECRET || "development-session-secret-change-in-production",
  // Server
  PORT: parseInt(process.env.PORT || "5000"),
  HOST: process.env.HOST || "0.0.0.0",
  NODE_ENV: process.env.NODE_ENV || "development",
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5000"],
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "12"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "5")
};
if (config.NODE_ENV === "production") {
  if (config.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters in production");
    process.exit(1);
  }
  if (config.SESSION_SECRET.length < 32) {
    console.error("SESSION_SECRET must be at least 32 characters in production");
    process.exit(1);
  }
}
console.log(`Configuration loaded for ${config.NODE_ENV} environment`);

// server/routes.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
async function registerRoutes(app2) {
  app2.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/ready", async (req, res) => {
    try {
      await storage.getUser(1);
      res.status(200).json({ status: "ready", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      res.status(503).json({ status: "not ready", error: "Database connection failed" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(userData.password, config.BCRYPT_ROUNDS);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      const token = jwt.sign({ userId: user.id }, config.JWT_SECRET);
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ userId: user.id }, config.JWT_SECRET);
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePictureUrl: req.user.profilePictureUrl,
        bio: req.user.bio,
        phone: req.user.phone
      }
    });
  });
  app2.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const { name, bio, profilePictureUrl, phone } = req.body;
      const updatedUser = await storage.updateUser(req.user.id, {
        name,
        bio,
        profilePictureUrl,
        phone
      });
      res.json({
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          profilePictureUrl: updatedUser.profilePictureUrl,
          bio: updatedUser.bio,
          phone: updatedUser.phone
        }
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });
  app2.get("/api/properties", async (req, res) => {
    try {
      const { location, rooms, maxPrice } = req.query;
      const filters = {};
      if (location) filters.location = location;
      if (rooms) filters.rooms = parseInt(rooms);
      if (maxPrice) filters.maxPrice = parseInt(maxPrice);
      const properties2 = await storage.getProperties(filters);
      res.json(properties2);
    } catch (error) {
      console.error("Get properties error:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  app2.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Get property error:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  app2.post("/api/properties", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== "landlord") {
        return res.status(403).json({ message: "Only landlords can create properties" });
      }
      const requestData = { ...req.body, landlordId: req.user.id };
      if (requestData.availableFrom && typeof requestData.availableFrom === "string") {
        requestData.availableFrom = new Date(requestData.availableFrom);
      }
      const propertyData = insertPropertySchema.parse(requestData);
      const property = await storage.createProperty(propertyData);
      res.json(property);
    } catch (error) {
      console.error("Create property error:", error);
      res.status(400).json({ message: "Failed to create property" });
    }
  });
  app2.put("/api/properties/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this property" });
      }
      const requestData = { ...req.body };
      if (requestData.availableFrom && typeof requestData.availableFrom === "string") {
        requestData.availableFrom = new Date(requestData.availableFrom);
      }
      const updateData = insertPropertySchema.partial().parse(requestData);
      const updatedProperty = await storage.updateProperty(id, updateData);
      res.json(updatedProperty);
    } catch (error) {
      console.error("Update property error:", error);
      res.status(400).json({ message: "Failed to update property" });
    }
  });
  app2.delete("/api/properties/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this property" });
      }
      await storage.deleteProperty(id);
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });
  app2.get("/api/messages", authenticateToken, async (req, res) => {
    try {
      const { otherUserId } = req.query;
      const messages2 = await storage.getMessages(
        req.user.id,
        otherUserId ? parseInt(otherUserId) : void 0
      );
      const enhancedMessages = await Promise.all(
        messages2.map(async (message) => {
          const fromUser = await storage.getUser(message.fromUserId);
          const toUser = await storage.getUser(message.toUserId);
          const property = message.propertyId ? await storage.getProperty(message.propertyId) : null;
          return {
            ...message,
            fromUserName: fromUser?.name || `Bruger ${message.fromUserId}`,
            toUserName: toUser?.name || `Bruger ${message.toUserId}`,
            propertyTitle: property?.title || null
          };
        })
      );
      res.json(enhancedMessages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/messages", authenticateToken, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        fromUserId: req.user.id
      });
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });
  app2.get("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const favorites2 = await storage.getFavorites(req.user.id);
      res.json(favorites2);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  app2.post("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const { propertyId } = req.body;
      const isAlreadyFavorite = await storage.isFavorite(req.user.id, propertyId);
      if (isAlreadyFavorite) {
        return res.status(400).json({ message: "Property already in favorites" });
      }
      const favorite = await storage.addFavorite({
        userId: req.user.id,
        propertyId
      });
      res.json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(400).json({ message: "Failed to add favorite" });
    }
  });
  app2.delete("/api/favorites/:propertyId", authenticateToken, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      await storage.removeFavorite(req.user.id, propertyId);
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/prod.ts
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || [
    "https://lejeboligfind.dk",
    "https://www.lejeboligfind.dk",
    "http://lejeboligfind.dk",
    "http://www.lejeboligfind.dk"
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: process.env.NODE_ENV || "production"
  });
});
app.get("/ready", (_req, res) => {
  res.json({
    status: "ready",
    database: "connected",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/debug/static", (_req, res) => {
  const staticPath = findStaticFilesPath();
  const indexPath = path.join(staticPath, "index.html");
  try {
    const files = fs.readdirSync(staticPath).map((file) => {
      const filePath = path.join(staticPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        isDirectory: stats.isDirectory()
      };
    });
    res.json({
      staticPath,
      indexPath,
      indexExists: fs.existsSync(indexPath),
      files,
      cwd: process.cwd(),
      dirname: __dirname
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to read static directory",
      staticPath,
      indexPath,
      message: err instanceof Error ? err.message : "Unknown error"
    });
  }
});
function findStaticFilesPath() {
  const possiblePaths = [
    path.join(__dirname, "public"),
    path.join(__dirname, "dist", "public"),
    path.join(__dirname, "..", "dist", "public"),
    path.join(process.cwd(), "dist", "public"),
    path.join(process.cwd(), "public"),
    "dist/public",
    "public"
  ];
  for (const staticPath of possiblePaths) {
    if (fs.existsSync(staticPath)) {
      return staticPath;
    }
  }
  return path.join(process.cwd(), "dist", "public");
}
async function startServer() {
  const PORT = parseInt(process.env.PORT || "5000", 10);
  const NODE_ENV = process.env.NODE_ENV || "production";
  await registerRoutes(app);
  const staticPath = findStaticFilesPath();
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    console.log(`Serving static files from: ${staticPath}`);
  } else {
    console.warn(`Static files path not found: ${staticPath}`);
  }
  app.get("/", (req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    console.log(`ROOT REQUEST: Looking for index.html at ${indexPath}`);
    console.log(`File exists: ${fs.existsSync(indexPath)}`);
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`Static files not found at ${staticPath}`);
      res.status(404).json({
        error: "Static files not found",
        path: staticPath,
        indexPath,
        exists: fs.existsSync(indexPath)
      });
    }
  });
  app.get("*", (req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: "Static files not found" });
    }
  });
  app.use((err, _req, res, _next) => {
    console.error("Error:", err);
    res.status(500).json({
      error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
    });
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server running on port ${PORT}`);
    console.log(`Static files path: ${staticPath}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
  });
}
startServer().catch(console.error);
