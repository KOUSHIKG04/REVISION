import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { db } from "./db";
import { users, courses, lessons, purchases } from "./db/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

const PORT = 3000;
const app = express();

const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET!, (err, payload) => {
      if (err) {
        return res.status(403).json({ error: "Forbidden - Invalid token" });
      }

      // Attach the decoded payload (id, role) to the request object so the next route can use it
      (req as any).user = payload;
      next();
    });
  } else {
    res.status(401).json({ error: "Unauthorized - No token provided" });
  }
};

app.use(express.json());

app.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: role || "STUDENT",
    });

    res.status(200).json({
      message: "User signed up successfully!",
    });
  } catch (error) {
    res.status(409).json({
      error: "Email already exists",
    });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/me", authenticateJwt, async (req, res) => {
  const userId = (req as any).user.id;

  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});

app.post("/courses", authenticateJwt, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.role !== "INSTRUCTOR") {
      return res
        .status(403)
        .json({ error: "Only instructors can create courses" });
    }

    const { title, description, price } = req.body;

    const [newCourse] = await db
      .insert(courses)
      .values({
        title,
        description,
        price,
        instructorId: user.id,
      })
      .returning();

    res.status(200).json(newCourse);
  } catch (error) {
    res.status(409).json({});
  }
});

app.get("/courses", async (req, res) => {
  try {
    const allCourses = await db.select().from(courses);
    res.status(200).json(allCourses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

app.get("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id as string;

    const [course] = await db.select().from(courses).where(eq(courses.id, id));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

app.patch(
  "/courses/:id",
  authenticateJwt,
  async (req: Request<{ id: string }>, res) => {
    try {
      // const id = req.params.id as string;
      const { id } = req.params;
      const user = (req as any).user;

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, id));

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      if (course.instructorId !== user.id) {
        return res
          .status(403)
          .json({ error: "You can only edit your own courses" });
      }

      const { title, description, price } = req.body;

      const [updatedCourse] = await db
        .update(courses)
        .set({ title, description, price, updatedAt: new Date() })
        .where(eq(courses.id, id))
        .returning();

      res.status(200).json(updatedCourse);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  },
);

app.delete("/courses/:id", authenticateJwt, async (req, res) => {
  try {
    const id = req.params.id as string;
    const user = (req as any).user;

    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.instructorId !== user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own courses" });
    }
    await db.delete(courses).where(eq(courses.id, id));

    res.status(200).json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});

app.post("/lessons", authenticateJwt, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.role !== "INSTRUCTOR") {
      return res
        .status(403)
        .json({ error: "Only instructors can add lessons" });
    }

    const { title, content, courseId } = req.body;

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (course.instructorId !== user.id) {
      return res
        .status(403)
        .json({ error: "You can only add lessons to your own courses" });
    }

    const [newLesson] = await db
      .insert(lessons)
      .values({
        title,
        content,
        courseId,
      })
      .returning();

    res.status(200).json(newLesson);
  } catch (error) {
    res.status(500).json({ error: "Failed to add lesson" });
  }
});

app.get("/courses/:id/lessons", async (req, res) => {
  try {
    const courseId = req.params.id as string;

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    res.status(200).json(courseLessons);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

app.post("/purchases", authenticateJwt, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== "STUDENT") {
      return res.status(403).json({ error: "Only students can purchase courses" });
    }

    const { courseId } = req.body;
    
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
   
    await db.insert(purchases).values({
      userId: user.id,
      courseId
    });
    res.status(200).json({ message: "Course purchased successfully" });
  } catch (error: any) {
    
    if (error.code === "23505") { 
      return res.status(409).json({ error: "You have already purchased this course" });
    }
    res.status(500).json({ error: "Failed to purchase course" });
  }
});


app.get("/users/:id/purchases", authenticateJwt, async (req, res) => {
  try {
    const requestedUserId = req.params.id as string;
    const user = (req as any).user;
    
    if (requestedUserId !== user.id) {
      return res.status(403).json({ error: "You can only view your own purchases" });
    }
  
    const myPurchases = await db
      .select({
        course: {
          id: courses.id,
          title: courses.title,
          description: courses.description,
          price: courses.price
        }
      })
      .from(purchases)
      .innerJoin(courses, eq(purchases.courseId, courses.id))
      .where(eq(purchases.userId, requestedUserId));
    res.status(200).json(myPurchases);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
