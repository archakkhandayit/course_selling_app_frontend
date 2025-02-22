const API_BASE = "https://course-selling-app-peach.vercel.app";
let currentUser = null;
let currentRole = localStorage.getItem("currentRole") || null;

// Show/hide sections
function showSection(sectionId) {
  // Hide all auth sections
  ["userAuth", "adminAuth"].forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });
  // Show requested section
  document.getElementById(sectionId).classList.remove("hidden");
}

// User Authentication
async function userSignup(e) {
  e.preventDefault();
  const [email, password, firstName, lastName] = Array.from(
    e.target.elements
  ).map((i) => i.value);

  try {
    await axios.post(`${API_BASE}/api/v1/user/signup`, {
      email,
      password,
      firstName,
      lastName,
    });
    alert("Registration successful! Please login.");
  } catch (error) {
    alert(error.response?.data?.message || "Registration failed");
  }
}

async function userLogin(e) {
  
  e.preventDefault();
  const [email, password] = Array.from(e.target.elements).map((i) => i.value);

  try {
    const res = await axios.post(`${API_BASE}/api/v1/user/signin`, {
      email,
      password,
    });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("currentRole", "user");
    // currentRole = 'user';
    showDashboard();
    loadCourses();
    loadPurchasedCourses();

    //  Clearning all userAuth input textContent
  const userAuth = document.getElementById("userAuth");
  const inputs = userAuth.querySelectorAll("input");
  inputs.forEach((input) => {
    input.value = ""; // Clears the value of each input
  });

  } catch (error) {
    alert(error.response?.data?.message || "Login failed");
  }
}

// Add Admin Authentication functions
async function adminSignup(e) {
  e.preventDefault();
  const [email, password, firstName, lastName] = Array.from(
    e.target.elements
  ).map((i) => i.value);

  try {
    await axios.post(`${API_BASE}/api/v1/admin/signup`, {
      email,
      password,
      firstName,
      lastName,
    });
    alert("Admin registration successful! Please login.");
  } catch (error) {
    alert(error.response?.data?.message || "Registration failed");
  }
}

async function adminLogin(e) {
  
  e.preventDefault();
  const [email, password] = Array.from(e.target.elements).map((i) => i.value);
  
  try {
    const res = await axios.post(`${API_BASE}/api/v1/admin/signin`, {
      email,
      password,
    });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("currentRole", "admin");
    // currentRole = 'admin';
    showDashboard();
    loadAdminCourses();

    //  Clearning all adminAuth input textContent
    const userAuth = document.getElementById("adminAuth");
    const inputs = userAuth.querySelectorAll("input");
    inputs.forEach((input) => {
      input.value = ""; // Clears the value of each input
    });

  } catch (error) {
    alert(error.response?.data?.message || "Admin login failed");
  }
}

async function createCourse(e) {
  e.preventDefault();
  const [title, description, price, imageUrl] = Array.from(
    e.target.elements
  ).map((i) => i.value);

  try {
    await axios.post(
      `${API_BASE}/api/v1/admin/course`,
      {
        title,
        description,
        price: parseFloat(price),
        imageUrl,
      },
      {
        headers: { token: localStorage.getItem("token") },
      }
    );
    alert("Course created successfully!");
    e.target.reset();
    loadAdminCourses();
  } catch (error) {
    alert(
      "Course creation failed: " +
        (error.response?.data?.message || "Server error")
    );
  }
}

async function loadAdminCourses() {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/admin/course/bulk`, {
      headers: { token: localStorage.getItem("token") },
    });

    const coursesHtml = res.data.courses
      .map(
        (course) => `
                <div class="col">
                    <div class="card course-card h-100">
                        <img src="${course.imageUrl}" class="card-img-top" alt="${course.title}">
                        <div class="card-body">
                            <h5 class="card-title">${course.title}</h5>
                            <p class="card-text">${course.description}</p>
                            <p class="text-success">$${course.price}</p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-warning" onclick="openEditModal('${course._id}')">Edit</button>
                                <button class="btn btn-danger" onclick="deleteCourse('${course._id}')">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `
      )
      .join("");

    document.getElementById("adminCourseList").innerHTML = coursesHtml;
  } catch (error) {
    console.error("Failed to load admin courses:", error);
    alert(error.response?.data?.message || "Failed to load courses");
  }
}

function openEditModal(courseId) {
  // Fetch course details and populate modal
  axios
    .post(
      `${API_BASE}/api/v1/admin/courseById`,

      { courseId },
      { headers: { token: localStorage.getItem("token") } }
    )
    .then((res) => {
      const course = res.data.course;
      document.getElementById("editCourseId").value = courseId;
      document.getElementById("editTitle").value = course.title;
      document.getElementById("editDescription").value = course.description;
      document.getElementById("editPrice").value = course.price;
      document.getElementById("editImageUrl").value = course.imageUrl;
      new bootstrap.Modal(document.getElementById("editCourseModal")).show();
    })
    .catch((error) => alert(error.response?.data?.message || "Failed to load course details"));
}

async function updateCourse(e) {
  e.preventDefault();
  const courseId = document.getElementById("editCourseId").value;

  try {
    await axios.put(
      `${API_BASE}/api/v1/admin/course`,
      {
        headers: { token: localStorage.getItem("token") },
        courseId,
        title: document.getElementById("editTitle").value,
        description: document.getElementById("editDescription").value,
        price: parseFloat(document.getElementById("editPrice").value),
        imageUrl: document.getElementById("editImageUrl").value,
      },
      {
        headers: { token: localStorage.getItem("token") },
      }
    );
    alert("Course updated successfully!");
    loadAdminCourses();
    bootstrap.Modal.getInstance(
      document.getElementById("editCourseModal")
    ).hide();
  } catch (error) {
    alert(
      "Update failed: " + (error.response?.data?.message || "Server error")
    );
  }
}

async function deleteCourse(courseId) {
  if (!confirm("Are you sure you want to delete this course?")) return;

  try {
    await axios.delete(`${API_BASE}/api/v1/admin/course`, {
      data: { courseId },
      headers: { token: localStorage.getItem("token") },
    });
    alert("Course deleted successfully!");
    loadAdminCourses();
  } catch (error) {
    alert(
      "Deletion failed: " + (error.response?.data?.message || "Server error")
    );
  }
}

async function loadPurchasedCourses() {
  try {
    // Fetch purchased courses for the logged-in user
    const res = await axios.get(`${API_BASE}/api/v1/user/purchases`, {
      headers: { token: localStorage.getItem("token") },
    });

    // Clear previous content
    const purchasedCoursesContainer =
      document.getElementById("purchasedCourses");
    purchasedCoursesContainer.innerHTML = "";

    // Check if there are any purchased courses
    if (res.data.length === 0) {
      purchasedCoursesContainer.innerHTML =
        "<p>You have not purchased any courses yet.</p>";
      return;
    }

    // Display purchased courses
    const coursesHtml = res.data.coursesData
      .map(
        (course) => `
                <div class="col">
                    <div class="card course-card h-100">
                        <img src="${course.imageUrl}" class="card-img-top" alt="${course.title}">
                        <div class="card-body">
                            <h5 class="card-title">${course.title}</h5>
                            <p class="card-text">${course.description}</p>
                            <p class="text-success">$${course.price}</p>
                            <button class="btn btn-success" disabled>Already Purchased</button>
                        </div>
                    </div>
                </div>
            `
      )
      .join("");

    purchasedCoursesContainer.innerHTML = coursesHtml;
  } catch (error) {
    console.error("Failed to load purchased courses:", error);
    alert(error.response?.data?.message || "Failed to load purchased courses. Please try again later.");
  }
}

// Course Purchasing
async function purchaseCourse(courseId) {
  try {
    // Get the list of purchased courses
    const purchasedCourses = await getPurchasedCourses();

    // Check if the course is already purchased
    if (purchasedCourses.some((purchase) => purchase._id === courseId)) {
      alert("You've already purchased this course!");
      return; // Stop execution if already purchased
    }

    // If not purchased, proceed with the API call
    const res = await axios.post(
      `${API_BASE}/api/v1/course/purchase`,
      { courseId },
      { headers: { token: localStorage.getItem("token") } }
    );

    alert("Purchase successful!");
    loadCourses(); // Refresh the list
    loadPurchasedCourses(); // Update purchased courses
  } catch (error) {
    alert(error.response?.data?.message || "Purchase failed");
  }
}

// Helper function to get purchased courses
async function getPurchasedCourses() {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/user/purchases`, {
      headers: { token: localStorage.getItem("token") },
    });
    return res.data.purchases.map((course) => course._id); // Return array of course IDs
  } catch (error) {
    console.error("Failed to fetch purchased courses:", error);
    return []; // Return empty array if there's an error
  }
}

// Load Courses
async function loadCourses() {
  try {
    // Get all courses
    const coursesRes = await axios.get(`${API_BASE}/api/v1/course/preview`);

    // Get user's purchased courses
    const purchasedCourses = await getPurchasedCourses();

    // Render courses
    const coursesHtml = coursesRes.data.allCourses
      .map(
        (course) => `
                <div class="col">
                    <div class="card course-card h-100">
                        <img src="${course.imageUrl}" class="card-img-top">
                        <div class="card-body">
                            <h5>${course.title}</h5>
                            <p>${course.description}</p>
                            <p>$${course.price}</p>
                            <button 
                                onclick="purchaseCourse('${course._id}')" 
                                class="btn btn-primary"
                                ${
                                  purchasedCourses.includes(course._id)
                                    ? "disabled"
                                    : ""
                                }
                            >
                                ${
                                  purchasedCourses.includes(course._id)
                                    ? "Purchased ✓"
                                    : "Enroll Now"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            `
      )
      .join("");

    document.getElementById("courseList").innerHTML = coursesHtml;
  } catch (error) {
    console.error("Failed to load courses:", error);
  }
}

// Show Dashboard
function showDashboard() {
  document.getElementById("userAuth").classList.add("hidden");
  document.getElementById("adminAuth").classList.add("hidden");
  currentRole = localStorage.getItem("currentRole") || null;
  if (currentRole === "user") {
    document.getElementById("userDashboard").classList.remove("hidden");
  } else if (currentRole === "admin") {
    document.getElementById("adminDashboard").classList.remove("hidden");
  }
}

// Logout
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentRole");
  // currentUser = null;
  // currentRole = null;
  showSection("userAuth");
  document.getElementById("adminDashboard").classList.add("hidden");
  document.getElementById("userDashboard").classList.add("hidden");
}

// Initialize
function init() {
  const token = localStorage.getItem("token");
  currentRole = localStorage.getItem("currentRole") || null;

  // Default showing userAuth
  if (!currentRole) {
    showSection("userAuth");
  } else {
    if (token) {
      // Verify token and determine role
      // You might need an /me endpoint to verify token
      // For simplicity, we'll assume user is logged in
      showDashboard();

      //  If User
      if (currentRole === "user") {
        loadCourses();
        loadPurchasedCourses();
      } else if (currentRole === "admin") {
        loadAdminCourses();
      }

    }
  }
}

init();
