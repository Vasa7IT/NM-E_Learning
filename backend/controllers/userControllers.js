const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = require("../schemas/userModel");
const courseSchema = require("../schemas/courseModel");
const enrolledCourseSchema = require("../schemas/enrolledCourseModel");
const coursePaymentSchema = require("../schemas/coursePaymentModel");

// Register new user
const registerController = async (req, res) => {
  try {
    const existingUser = await userSchema.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(200).json({ message: "User already exists", success: false });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new userSchema({ ...req.body, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ message: "Register Success", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login user
const loginController = async (req, res) => {
  try {
    const user = await userSchema.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password", success: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, { expiresIn: "1d" });
    return res.status(200).json({ message: "Login success", success: true, token, userData: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all courses
const getAllCoursesController = async (req, res) => {
  try {
    const allCourses = await courseSchema.find();
    if (!allCourses.length) {
      return res.status(404).json({ message: "No Courses Found", success: false });
    }
    return res.status(200).json({ success: true, data: allCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve courses" });
  }
};

// Create a new course
const postCourseController = async (req, res) => {
  try {
    const {
      userId,
      C_educator,
      C_title,
      C_categories,
      C_price,
      C_description,
      S_title,
      S_description,
    } = req.body;

    // Ensure S_title and S_description are arrays
    if (!Array.isArray(S_title) || !Array.isArray(S_description)) {
      return res.status(400).json({ success: false, message: "S_title and S_description must be arrays" });
    }

    // Map files if they exist, otherwise assign default empty content
    const S_content = req.files ? req.files.map((file) => ({ filename: file.filename, path: `/uploads/${file.filename}` })) : [];

    // Create sections array
    const sections = S_title.map((title, i) => ({
      S_title: title,
      S_content: S_content[i] || { filename: null, path: null }, // Assign empty object if no file
      S_description: S_description[i],
    }));

    const course = new courseSchema({
      userId,
      C_educator,
      C_title,
      C_categories,
      C_price: C_price === 0 ? "free" : C_price,
      C_description,
      sections,
    });

    await course.save();
    res.status(201).json({ success: true, message: "Course created successfully" });
  } catch (error) {
    console.error("Error in postCourseController:", error);
    res.status(500).json({ success: false, message: "Failed to create course" });
  }
};

// Get all courses for a specific user
const getAllCoursesUserController = async (req, res) => {
  try {
    const userCourses = await courseSchema.find({ userId: req.body.userId });
    if (!userCourses.length) {
      return res.status(404).json({ success: false, message: "No Courses Found" });
    }
    return res.status(200).json({ success: true, data: userCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
};

// Delete a course by ID
const deleteCourseController = async (req, res) => {
  try {
    const course = await courseSchema.findByIdAndDelete(req.params.courseid);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete course" });
  }
};

// Enroll user in a course
const enrolledCourseController = async (req, res) => {
  try {
    const course = await courseSchema.findById(req.params.courseid);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course Not Found!" });
    }

    const existingEnrollment = await enrolledCourseSchema.findOne({
      courseId: req.params.courseid,
      userId: req.body.userId,
    });

    if (existingEnrollment) {
      return res.status(200).json({
        success: false,
        message: "You are already enrolled in this Course!",
        course: { id: course._id, Title: course.C_title },
      });
    }

    const enrollment = new enrolledCourseSchema({
      courseId: req.params.courseid,
      userId: req.body.userId,
      course_Length: course.sections.length,
    });
    await enrollment.save();

    course.enrolled += 1;
    await course.save();

    const payment = new coursePaymentSchema({ ...req.body, userId: req.body.userId, courseId: req.params.courseid });
    await payment.save();

    res.status(200).json({
      success: true,
      message: "Enrolled Successfully",
      course: { id: course._id, Title: course.C_title },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to enroll in the course" });
  }
};

// Get course content for learning
const sendCourseContentController = async (req, res) => {
  try {
    const course = await courseSchema.findById(req.params.courseid);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollment = await enrolledCourseSchema.findOne({
      userId: req.body.userId,
      courseId: req.params.courseid,
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "User not enrolled in course" });
    }

    res.status(200).json({
      success: true,
      courseContent: course.sections,
      progress: enrollment.progress,
      certificateData: enrollment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Mark a section as complete
const completeSectionController = async (req, res) => {
  try {
    const enrollment = await enrolledCourseSchema.findOne({
      courseId: req.body.courseId,
      userId: req.body.userId,
    });

    if (!enrollment) {
      return res.status(400).json({ message: "User is not enrolled in the course" });
    }

    enrollment.progress.push({ sectionId: req.body.sectionId });
    await enrollment.save();

    res.status(200).json({ message: "Section completed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all enrolled courses for a user
const sendAllCoursesUserController = async (req, res) => {
  try {
    const enrolledCourses = await enrolledCourseSchema.find({ userId: req.body.userId }).populate("courseId");

    const coursesDetails = enrolledCourses.map((enrollment) => enrollment.courseId);

    res.status(200).json({ success: true, data: coursesDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
};

module.exports = {
  registerController,
  loginController,
  getAllCoursesController,
  postCourseController,
  getAllCoursesUserController,
  deleteCourseController,
  enrolledCourseController,
  sendCourseContentController,
  completeSectionController,
  sendAllCoursesUserController,
};
