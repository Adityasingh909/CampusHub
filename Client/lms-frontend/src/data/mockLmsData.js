// Centralized mock LMS dataset for CampusHub LMS

export const currentUser = {
  id: "student-1",
  name: "Aditya Sharma",
  rollNo: "CS2024-8842",
  email: "aditya.sharma@campushub.edu",
  department: "Computer Science & Engineering",
  semester: "Semester 5 (Fall 2026)",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
  initials: "AS",
  role: "student",
  phone: "+91 98765 43210",
  dob: "2004-08-14",
  gender: "Male",
  bloodGroup: "O+",
  bio: "Third-year Computer Science undergraduate focusing on distributed systems, modern web architectures, and algorithm optimization.",
  program: "B.Tech Computer Science & Engineering",
  school: "School of Computing",
  address: {
    street: "Room 304, Kaveri Hostel Block B",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560100",
    emergencyContactName: "Dr. Rajesh Sharma (Father)",
    emergencyPhone: "+91 98765 00000",
  },
  academics: {
    cgpa: "8.92",
    totalCredits: 84,
    requiredCredits: 160,
    attendanceRate: "94.2%",
    classRank: "Top 5% (Cohort 2026)",
    admissionYear: "2024",
    validThrough: "June 2028",
  },
  notifications: {
    gradeAlerts: true,
    deadlineReminders: true,
    quizAlerts: true,
    announcements: true,
    cohortVisibility: false,
  },
  lastUpdated: "Oct 16, 2026",
  stats: {
    enrolledCourses: 6,
    activeLabs: 2,
    pendingAssignments: 3,
    urgentDeadlines: 1,
    upcomingQuizzes: 2,
    academicProgress: 82,
    currentGrade: "A-",
    gpaTrend: "+3.4%",
    attendanceRate: "94.2%",
    totalCredits: 22,
  },
};

export function getSavedUserProfile() {
  if (typeof window === "undefined") return currentUser;
  try {
    const raw = localStorage.getItem("campushub_user_profile");
    if (!raw) return currentUser;
    const parsed = JSON.parse(raw);
    return {
      ...currentUser,
      ...parsed,
      address: { ...currentUser.address, ...(parsed.address || {}) },
      academics: { ...currentUser.academics, ...(parsed.academics || {}) },
      notifications: { ...currentUser.notifications, ...(parsed.notifications || {}) },
    };
  } catch (_e) {
    return currentUser;
  }
}

export function saveUserProfileToStorage(profile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("campushub_user_profile", JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile to localStorage", e);
  }
}

export const coursesData = [
  {
    id: "web-development",
    code: "CS-301",
    title: "Web Development",
    instructor: "Prof. Linda Cruz",
    instructorRole: "Associate Professor, CSE Dept",
    instructorEmail: "linda.cruz@campushub.edu",
    credits: 4,
    progress: 78,
    category: "In Progress",
    thumbnail:
      "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&q=80&w=600",
    description:
      "Modern full-stack web architectures covering React 19, Tailwind CSS, asynchronous pipelines, Node.js microservices, state machines, and RESTful API engineering.",
    schedule: "Mon & Wed • 10:00 AM - 11:30 AM",
    room: "Computing Lab 4B",
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Modern DOM & Component Lifecycles",
        weeks: "Weeks 1-3",
        status: "Completed",
        lessons: [
          { title: "Virtual DOM & Reconciliation in React 19", duration: "45m", type: "video" },
          { title: "Custom Hooks & Composition Patterns", duration: "60m", type: "slides" },
          { title: "State Cart Architecture Exercise", duration: "30m", type: "lab" },
        ],
      },
      {
        id: "mod-2",
        title: "Module 2: State Flow, Reducers & Context Pipelines",
        weeks: "Weeks 4-6",
        status: "In Progress",
        lessons: [
          { title: "Action Dispatchers & Context Performance", duration: "50m", type: "video" },
          { title: "Managing Global UI State Cleanly", duration: "40m", type: "reading" },
          { title: "Lab 3: React State Cart Architecture", duration: "90m", type: "lab" },
        ],
      },
      {
        id: "mod-3",
        title: "Module 3: Full-Stack APIs & Asynchronous State",
        weeks: "Weeks 7-9",
        status: "Upcoming",
        lessons: [
          { title: "REST vs GraphQL in Distributed Systems", duration: "55m", type: "video" },
          { title: "JWT & Stateless Session Authentication", duration: "50m", type: "reading" },
        ],
      },
    ],
    materials: [
      { id: "mat-1", title: "React 19 Core Architecture & Hooks Cheatsheet", type: "PDF", size: "3.4 MB", date: "Oct 12" },
      { id: "mat-2", title: "Tailwind CSS Component Architecture Guide", type: "PDF", size: "1.8 MB", date: "Oct 14" },
      { id: "mat-3", title: "Lab Starter Repository & Unit Tests", type: "ZIP", size: "12.6 MB", date: "Oct 16" },
      { id: "mat-4", title: "Lecture Recording: Context vs Reducers Live Walkthrough", type: "MP4", size: "245 MB", date: "Oct 17" },
    ],
    announcements: [
      {
        id: "ann-1",
        title: "Lab 3 Submission Deadline Extended by 24h",
        date: "Oct 18, 2026",
        content: "Due to scheduled network maintenance in Computing Lab 4B, the React State Cart assignment deadline is now Wednesday 11:59 PM.",
      },
      {
        id: "ann-2",
        title: "Office Hours Shift for Midterm Q&A",
        date: "Oct 15, 2026",
        content: "Drop-in office hours this Thursday will be held on Zoom from 3:00 PM to 5:00 PM.",
      },
    ],
  },
  {
    id: "database-systems",
    code: "CS-304",
    title: "Database Systems",
    instructor: "Dr. Jonathan Reyes",
    instructorRole: "Professor of Data Architecture",
    instructorEmail: "jonathan.reyes@campushub.edu",
    credits: 4,
    progress: 64,
    category: "In Progress",
    thumbnail:
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600",
    description:
      "Relational algebra, relational calculus, query optimization heuristics, transaction isolation, ACID guarantees, and PostgreSQL index internals.",
    schedule: "Tue & Thu • 02:00 PM - 03:30 PM",
    room: "Auditorium Hall C",
    modules: [
      {
        id: "db-mod-1",
        title: "Module 1: Relational Algebra & Calculus",
        weeks: "Weeks 1-4",
        status: "Completed",
        lessons: [
          { title: "Set Theory & Projection Heuristics", duration: "50m", type: "video" },
          { title: "Relational Join Trees & Equi-Joins", duration: "75m", type: "slides" },
        ],
      },
      {
        id: "db-mod-2",
        title: "Module 2: Advanced SQL & Join Optimization",
        weeks: "Weeks 5-8",
        status: "In Progress",
        lessons: [
          { title: "LAB-8: To implement join concepts", duration: "120m", type: "lab" },
          { title: "B-Tree vs Hash Indexing Benchmarks", duration: "45m", type: "reading" },
        ],
      },
    ],
    materials: [
      { id: "mat-db-1", title: "LAB-8 Relational Join Schema Dump", type: "SQL", size: "450 KB", date: "Oct 10" },
      { id: "mat-db-2", title: "Query Execution Plan Cheat Sheet", type: "PDF", size: "2.1 MB", date: "Oct 15" },
    ],
    announcements: [
      {
        id: "ann-db-1",
        title: "Relational Algebra Quiz 3 scheduled for Oct 24",
        date: "Oct 17, 2026",
        content: "Please review Chapter 4 on nested queries, theta joins, and division operators.",
      },
    ],
  },
  {
    id: "operating-systems",
    code: "CS-302",
    title: "Operating Systems",
    instructor: "Prof. Marcus Vance",
    instructorRole: "Chair of Systems Research",
    instructorEmail: "marcus.vance@campushub.edu",
    credits: 4,
    progress: 88,
    category: "In Progress",
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
    description:
      "Kernel architectures, concurrency primitives, thread synchronization with semaphores and mutexes, virtual memory paging, and disk scheduling algorithms.",
    schedule: "Mon & Fri • 08:30 AM - 10:00 AM",
    room: "Computing Hall 2A",
    modules: [],
    materials: [],
    announcements: [],
  },
  {
    id: "computer-networks",
    code: "CS-305",
    title: "Computer Networks",
    instructor: "Dr. Elena Rostova",
    instructorRole: "Faculty of Telecommunications",
    instructorEmail: "elena.rostova@campushub.edu",
    credits: 3,
    progress: 52,
    category: "In Progress",
    thumbnail:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600",
    description:
      "Layered OSI and TCP/IP protocol suites, congestion control, Dijkstra routing heuristics, DNS hierarchy, and TLS handshake security protocols.",
    schedule: "Tue & Fri • 11:30 AM - 01:00 PM",
    room: "Network Research Lab",
    modules: [],
    materials: [],
    announcements: [],
  },
  {
    id: "data-structures",
    code: "CS-201",
    title: "Data Structures & Alg.",
    instructor: "Dr. Vikram Seth",
    instructorRole: "Professor of Theoretical Computing",
    instructorEmail: "vikram.seth@campushub.edu",
    credits: 4,
    progress: 95,
    category: "In Progress",
    thumbnail:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600",
    description:
      "Balanced search trees (AVL, Red-Black), dynamic programming, network flow algorithms, and asymptotic complexity proofs.",
    schedule: "Wed & Thu • 03:30 PM - 05:00 PM",
    room: "Main Auditorium",
    modules: [],
    materials: [],
    announcements: [],
  },
  {
    id: "software-engineering",
    code: "CS-308",
    title: "Software Engineering",
    instructor: "Prof. Sarah Jenkins",
    instructorRole: "Lecturer in Agile Practices",
    instructorEmail: "sarah.jenkins@campushub.edu",
    credits: 3,
    progress: 100,
    category: "Completed",
    thumbnail:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
    description:
      "Agile ceremonies, test-driven development (TDD), CI/CD automated deployment pipelines, design patterns, and software maintenance metrics.",
    schedule: "Completed Fall 2026 Session",
    room: "Seminar Room 1",
    modules: [],
    materials: [],
    announcements: [],
  },
];

export const assignmentsData = [
  {
    id: "react-state-cart",
    title: "Assignment 03: React State Cart Architecture & Context Pipeline",
    courseId: "web-development",
    courseCode: "CS-301",
    courseName: "Web Development",
    instructor: "Prof. Linda Cruz",
    dueDate: "Tomorrow, 11:59 PM",
    dueTimestamp: "2026-10-18T23:59:00",
    timeLeft: "18 hours left",
    weight: "15%",
    totalPoints: 100,
    status: "Urgent", // Urgent | Pending | Submitted | Graded
    description:
      "Construct a production-ready shopping cart state pipeline using React 19 Context and useReducer. Enforce optimistic mutations, cart persistence in localStorage, and clean separation between dispatch actions and UI presentation components.",
    instructions: [
      "Implement a CartProvider wrapping the sample ecommerce catalogue.",
      "Support addItem, removeItem, updateQuantity, and clearCart dispatch actions.",
      "Ensure unit test coverage exceeds 85% for reducers.",
      "Provide a clean README with instructions to launch the Vite preview server.",
    ],
    submissionFormat: "ZIP or TAR.GZ (Max 50 MB)",
    maxFileSize: "50 MB",
    submittedFile: null,
  },
  {
    id: "lab-8-join-concepts",
    title: "LAB-8: To implement join concepts and query optimization",
    courseId: "database-systems",
    courseCode: "CS-304",
    courseName: "Database Systems",
    instructor: "Dr. Jonathan Reyes",
    dueDate: "Oct 21, 2026 • 11:59 PM",
    dueTimestamp: "2026-10-21T23:59:00",
    timeLeft: "3 days remaining",
    weight: "10%",
    totalPoints: 50,
    status: "Pending",
    description:
      "Write SQL scripts and relational algebra expressions demonstrating INNER JOIN, LEFT OUTER JOIN, RIGHT OUTER JOIN, FULL OUTER JOIN, and CROSS JOIN on the provided University schema.",
    instructions: [
      "Download the university_schema.sql file from the course resources.",
      "Execute the query scripts in PostgreSQL 16.",
      "Generate the EXPLAIN ANALYZE execution plan for each join operation.",
      "Submit your final SQL queries file alongside a PDF with query screenshots.",
    ],
    submissionFormat: "SQL, PDF, or DOCX (Max 25 MB)",
    maxFileSize: "25 MB",
    submittedFile: null,
  },
  {
    id: "process-synchronization",
    title: "Lab 04: Process Synchronization & Semaphore Concurrency",
    courseId: "operating-systems",
    courseCode: "CS-302",
    courseName: "Operating Systems",
    instructor: "Prof. Marcus Vance",
    dueDate: "Oct 27, 2026 • 05:00 PM",
    dueTimestamp: "2026-10-27T17:00:00",
    timeLeft: "5 days remaining",
    weight: "20%",
    totalPoints: 100,
    status: "In Progress",
    description:
      "Implement the classic Dining Philosophers and Producer-Consumer concurrency problems using POSIX semaphores and mutex locks in C/C++ without deadlocks.",
    instructions: [
      "Use pthread and semaphore.h library primitives.",
      "Ensure zero race conditions or priority inversions under thread stress test.",
      "Include a Valgrind memory leak report in your submission.",
    ],
    submissionFormat: "C, CPP, TAR.GZ (Max 20 MB)",
    maxFileSize: "20 MB",
    submittedFile: null,
  },
  {
    id: "red-black-trees",
    title: "Problem Set 4: Red-Black Trees & Balanced Search Heuristics",
    courseId: "data-structures",
    courseCode: "CS-201",
    courseName: "Data Structures & Alg.",
    instructor: "Dr. Vikram Seth",
    dueDate: "Oct 14, 2026",
    dueTimestamp: "2026-10-14T23:59:00",
    timeLeft: "Graded",
    weight: "15%",
    totalPoints: 100,
    status: "Graded",
    score: "96/100",
    feedback: "Exceptional tree rotation proofs. Edge case on double black leaf handled gracefully.",
    description: "Proof assignments for Red-Black tree node insertion recoloring invariants.",
    submissionFormat: "PDF or ZIP (Max 15 MB)",
    maxFileSize: "15 MB",
    submittedFile: {
      name: "aditya_sharma_ps4_solutions.pdf",
      size: "2.4 MB",
      uploadedAt: "Oct 13, 2026 • 08:30 PM",
    },
  },
];

export function getSavedSubmissions() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("campushub_submissions");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveSubmissionToStorage(assignmentId, submissionRecord) {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedSubmissions();
    current[assignmentId] = {
      ...submissionRecord,
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem("campushub_submissions", JSON.stringify(current));
  } catch (e) {
    console.error("Failed to persist submission to localStorage", e);
  }
}

export function getMergedAssignments() {
  const saved = getSavedSubmissions();
  return assignmentsData.map((a) => {
    if (saved[a.id]) {
      return {
        ...a,
        status: "Submitted",
        timeLeft: "Submitted for Review",
        submittedFile: saved[a.id].file || a.submittedFile,
        submittedAt: saved[a.id].submittedAt,
      };
    }
    return a;
  });
}

export const quizzesData = [
  {
    id: "relational-algebra-midterm",
    title: "Mid-Term: Relational Algebra & SQL Subqueries",
    courseId: "database-systems",
    courseCode: "CS-304",
    courseName: "Database Systems",
    status: "live", // live | upcoming | past
    durationMinutes: 45,
    totalQuestions: 6,
    totalMarks: 30,
    windowStart: "Today, 02:00 PM",
    windowEnd: "Today, 04:00 PM",
    description:
      "Assesses relational selection, projection, cartesian products, theta joins, division operator formulations, and correlated SQL subqueries.",
    questions: [
      {
        id: 1,
        question:
          "Which of the following relational algebra operations is fundamentally non-commutative?",
        options: [
          { key: "A", text: "Cartesian Product (R × S)" },
          { key: "B", text: "Set Difference (R − S)" },
          { key: "C", text: "Natural Join (R ⋈ S)" },
          { key: "D", text: "Set Union (R ∪ S)" },
        ],
        correctAnswer: "B",
        explanation: "Set difference is non-commutative because R − S produces tuples in R not in S, which is not equal to S − R.",
      },
      {
        id: 2,
        question:
          "In SQL, what is the primary architectural difference between WHERE and HAVING clauses?",
        options: [
          { key: "A", text: "WHERE filters rows before aggregation; HAVING filters groups after aggregation" },
          { key: "B", text: "WHERE can only be used with subqueries, while HAVING cannot" },
          { key: "C", text: "HAVING is strictly faster than WHERE due to indexing" },
          { key: "D", text: "There is no difference; they are aliases in ANSI SQL" },
        ],
        correctAnswer: "A",
        explanation: "WHERE applies row-level predicate filtering before the GROUP BY reduction pipeline, whereas HAVING filters aggregate partition buckets.",
      },
      {
        id: 3,
        question:
          "Consider relation R(A, B) and S(B, C). If R has 100 tuples and S has 50 tuples, what is the theoretical maximum number of tuples in R ⋈ S?",
        options: [
          { key: "A", text: "50" },
          { key: "B", text: "150" },
          { key: "C", text: "5,000" },
          { key: "D", text: "100" },
        ],
        correctAnswer: "C",
        explanation: "If all tuples in R and S share the exact same foreign key value for attribute B, the natural join produces the Cartesian cross product of 100 × 50 = 5,000 tuples.",
      },
      {
        id: 4,
        question:
          "Which SQL transaction isolation level prevents Dirty Reads and Non-Repeatable Reads, but permits Phantom Reads in ANSI SQL?",
        options: [
          { key: "A", text: "Read Uncommitted" },
          { key: "B", text: "Read Committed" },
          { key: "C", text: "Repeatable Read" },
          { key: "D", text: "Serializable" },
        ],
        correctAnswer: "C",
        explanation: "Repeatable Read locks existing scanned rows against mutations, but predicate scans may detect newly inserted 'phantom' rows unless Serializable predicate locking is used.",
      },
      {
        id: 5,
        question:
          "Which relational operator corresponds directly to the universal quantifier (∀) in first-order relational calculus?",
        options: [
          { key: "A", text: "Division Operator (R ÷ S)" },
          { key: "B", text: "Theta Join (R ⋈_θ S)" },
          { key: "C", text: "Intersection (R ∩ S)" },
          { key: "D", text: "Projection (π_A R)" },
        ],
        correctAnswer: "A",
        explanation: "The Division operator is designated to answer queries containing 'for all' or 'every', expressing universal quantification.",
      },
      {
        id: 6,
        question:
          "What is the time complexity of searching a secondary B+ Tree index with height h and node fanout B?",
        options: [
          { key: "A", text: "O(1)" },
          { key: "B", text: "O(h · log₂ B)" },
          { key: "C", text: "O(N²)" },
          { key: "D", text: "O(B^h)" },
        ],
        correctAnswer: "B",
        explanation: "At each of the h levels, a binary search across up to B keys takes O(log₂ B), totaling O(h · log₂ B).",
      },
    ],
  },
  {
    id: "process-scheduling-deadlock",
    title: "Process Scheduling & Deadlock Quiz",
    courseId: "operating-systems",
    courseCode: "CS-302",
    courseName: "Operating Systems",
    status: "upcoming",
    durationMinutes: 30,
    totalQuestions: 4,
    totalMarks: 20,
    scheduledDate: "Oct 24, 2026 • 02:00 PM",
    description:
      "Covers Banker's Algorithm safety sequences, Resource Allocation Graphs, Shortest Job First (SJF) scheduling, and Round Robin quantum starvation.",
    questions: [
      {
        id: 1,
        question: "Which of the following conditions is NOT one of Coffman's four conditions for deadlock?",
        options: [
          { key: "A", text: "Mutual Exclusion" },
          { key: "B", text: "Hold and Wait" },
          { key: "C", text: "Preemption Allowed" },
          { key: "D", text: "Circular Wait" },
        ],
        correctAnswer: "C",
        explanation: "No Preemption is a mandatory deadlock condition; allowing preemption eliminates deadlocks.",
      },
      {
        id: 2,
        question: "In Shortest Remaining Time First (SRTF) scheduling, a running process is preempted when:",
        options: [
          { key: "A", text: "Its time slice expires" },
          { key: "B", text: "A new process arrives with remaining burst time shorter than the current process" },
          { key: "C", text: "An I/O request finishes regardless of remaining burst time" },
          { key: "D", text: "The priority aging threshold triggers" },
        ],
        correctAnswer: "B",
        explanation: "SRTF is the preemptive variant of SJF, switching to newly arrived processes with smaller remaining burst times.",
      },
      {
        id: 3,
        question: "What does the Banker's Algorithm primarily compute before allocating requested resources?",
        options: [
          { key: "A", text: "Whether the system will remain in a Safe State" },
          { key: "B", text: "The cache hit ratio of the process" },
          { key: "C", text: "The optimal quantum duration" },
          { key: "D", text: "Virtual memory page fault frequency" },
        ],
        correctAnswer: "A",
        explanation: "Banker's Algorithm verifies whether granting the request keeps the system in a guaranteed safe execution sequence.",
      },
      {
        id: 4,
        question: "Which CPU scheduling algorithm exhibits the Convoy Effect?",
        options: [
          { key: "A", text: "First-Come First-Served (FCFS)" },
          { key: "B", text: "Round Robin (RR)" },
          { key: "C", text: "Multilevel Feedback Queues (MLFQ)" },
          { key: "D", text: "Shortest Job First (SJF)" },
        ],
        correctAnswer: "A",
        explanation: "In FCFS, when a long CPU-bound process occupies the processor, short I/O-bound processes queue behind it in a convoy.",
      },
    ],
  },
  {
    id: "react-hooks-lifecycle",
    title: "React Hooks & Component Lifecycle Quiz",
    courseId: "web-development",
    courseCode: "CS-301",
    courseName: "Web Development",
    status: "upcoming",
    durationMinutes: 35,
    totalQuestions: 4,
    totalMarks: 20,
    scheduledDate: "Oct 29, 2026 • 10:00 AM",
    description:
      "Covers useEffect dependency arrays, cleanup functions, useMemo vs useCallback benchmarks, and server-side component rendering boundaries.",
    questions: [
      {
        id: 1,
        question: "When does the cleanup return callback of a useEffect hook execute?",
        options: [
          { key: "A", text: "Only on initial component mount" },
          { key: "B", text: "Before the effect re-runs and when the component unmounts" },
          { key: "C", text: "Synchronously before DOM mutation" },
          { key: "D", text: "Inside the render phase before reconciliation" },
        ],
        correctAnswer: "B",
        explanation: "The cleanup function cleans up past subscriptions before subsequent re-runs and on unmount.",
      },
      {
        id: 2,
        question: "What is the primary difference between useCallback and useMemo?",
        options: [
          { key: "A", text: "useCallback caches a memoized function instance; useMemo caches a computed value" },
          { key: "B", text: "useCallback can only be used with DOM events" },
          { key: "C", text: "useMemo executes asynchronously in web workers" },
          { key: "D", text: "There is no difference; they are aliases" },
        ],
        correctAnswer: "A",
        explanation: "useCallback(fn, deps) is syntactic sugar for useMemo(() => fn, deps), caching the function reference.",
      },
      {
        id: 3,
        question: "In React 19, what does passing an action function to form actions or useActionState automatically handle?",
        options: [
          { key: "A", text: "Optimistic updates, pending transition state, and error boundaries" },
          { key: "B", text: "CSS style bundling" },
          { key: "C", text: "Database connection pools" },
          { key: "D", text: "Browser window resizing" },
        ],
        correctAnswer: "A",
        explanation: "React 19 native action hooks manage pending states, resets, and optimistic mutations seamlessly.",
      },
      {
        id: 4,
        question: "Why should you never call hooks conditionally inside if statements?",
        options: [
          { key: "A", text: "Because React relies on consistent hook call order across renders to link internal state" },
          { key: "B", text: "Because JavaScript engines disable JIT optimization for hooks" },
          { key: "C", text: "Because if statements cannot evaluate Boolean expressions in JSX" },
          { key: "D", text: "Because hooks run in separate web worker threads" },
        ],
        correctAnswer: "A",
        explanation: "React matches fiber state cells to hook calls strictly by invocation order across sequential renders.",
      },
    ],
  },
  {
    id: "binary-trees-graph-traversal",
    title: "Binary Trees & Graph Traversal Checkpoint",
    courseId: "data-structures",
    courseCode: "CS-201",
    courseName: "Data Structures & Alg.",
    status: "past",
    durationMinutes: 40,
    totalQuestions: 4,
    totalMarks: 20,
    score: "18/20 (90%)",
    completedDate: "Oct 05, 2026",
    description:
      "DFS vs BFS cycle detection in directed graphs, topological sorting, and Dijkstra priority queue complexity.",
    questions: [
      {
        id: 1,
        question: "Which traversal of a Binary Search Tree (BST) visits nodes in strictly ascending sorted order?",
        options: [
          { key: "A", text: "Pre-order Traversal" },
          { key: "B", text: "In-order Traversal" },
          { key: "C", text: "Post-order Traversal" },
          { key: "D", text: "Level-order Traversal" },
        ],
        correctAnswer: "B",
        explanation: "In-order traversal visits (Left, Root, Right), which outputs keys in ascending sorted sequence for any valid BST.",
      },
      {
        id: 2,
        question: "What is the worst-case time complexity of Dijkstra's algorithm implemented with a Min-Heap priority queue?",
        options: [
          { key: "A", text: "O(V²)" },
          { key: "B", text: "O((V + E) log V)" },
          { key: "C", text: "O(E²)" },
          { key: "D", text: "O(V · E)" },
        ],
        correctAnswer: "B",
        explanation: "Heap extraction takes O(log V) per vertex and edge relaxation takes O(log V) per edge, yielding O((V + E) log V).",
      },
      {
        id: 3,
        question: "Which condition indicates a cycle in a Directed Graph during Depth-First Search (DFS)?",
        options: [
          { key: "A", text: "Encountering a cross edge" },
          { key: "B", text: "Encountering a back edge to a node in the current recursion call stack" },
          { key: "C", text: "Encountering a forward edge" },
          { key: "D", text: "Encountering a tree leaf" },
        ],
        correctAnswer: "B",
        explanation: "A back edge points to an ancestor node currently active in the DFS recursion stack (GRAY color in three-color DFS).",
      },
      {
        id: 4,
        question: "In an AVL tree, what is the maximum permissible difference between the heights of the left and right subtrees?",
        options: [
          { key: "A", text: "0" },
          { key: "B", text: "1" },
          { key: "C", text: "2" },
          { key: "D", text: "log₂ N" },
        ],
        correctAnswer: "B",
        explanation: "The AVL balance factor invariant requires |height(left) - height(right)| ≤ 1.",
      },
    ],
  },
];

export function getSavedQuizzes() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("campushub_quizzes");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveQuizResultToStorage(quizId, resultData) {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedQuizzes();
    current[quizId] = {
      ...resultData,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem("campushub_quizzes", JSON.stringify(current));
    // Clear draft on submission
    clearQuizDraft(quizId);
  } catch (e) {
    console.error("Failed to save quiz result", e);
  }
}

export function getQuizDraft(quizId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`campushub_quiz_draft_${quizId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveQuizDraft(quizId, draft) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`campushub_quiz_draft_${quizId}`, JSON.stringify(draft));
  } catch (e) {
    console.error("Failed to save quiz draft", e);
  }
}

export function clearQuizDraft(quizId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`campushub_quiz_draft_${quizId}`);
  } catch (e) {
    // ignore
  }
}

export function getMergedQuizzes() {
  const saved = getSavedQuizzes();
  return quizzesData.map((q) => {
    if (saved[q.id]) {
      return {
        ...q,
        status: "past",
        score: `${saved[q.id].pointsScored}/${q.totalMarks} (${saved[q.id].percentage}%)`,
        completedDate: "Just now",
        userAnswers: saved[q.id].answers,
      };
    }
    return q;
  });
}

export const defaultFolders = [
  "All",
  "Semester 3 Notes",
  "Project Drafts",
  "Reference Cheatsheets",
  "General Studies",
  "Career & Resumes",
];

export const privateFilesData = [
  {
    id: "file-1",
    name: "Database_Indexing_Cheatsheet.pdf",
    folder: "Reference Cheatsheets",
    type: "pdf",
    size: "2.4 MB",
    sizeBytes: 2516582,
    updatedAt: "Oct 18, 2026 • 02:45 PM",
  },
  {
    id: "file-2",
    name: "React_Hooks_Summary.docx",
    folder: "Semester 3 Notes",
    type: "doc",
    size: "1.1 MB",
    sizeBytes: 1153433,
    updatedAt: "Oct 16, 2026 • 04:30 PM",
  },
  {
    id: "file-3",
    name: "Operating_Systems_Lab4_Draft.c",
    folder: "Project Drafts",
    type: "code",
    size: "145 KB",
    sizeBytes: 148480,
    updatedAt: "Oct 14, 2026 • 11:15 AM",
  },
  {
    id: "file-4",
    name: "Algorithms_Dynamic_Programming.pdf",
    folder: "Reference Cheatsheets",
    type: "pdf",
    size: "4.8 MB",
    sizeBytes: 5033164,
    updatedAt: "Oct 10, 2026 • 09:20 AM",
  },
  {
    id: "file-5",
    name: "CS301_Project_Proposal_Draft_v2.pdf",
    folder: "Project Drafts",
    type: "pdf",
    size: "2.8 MB",
    sizeBytes: 2936012,
    updatedAt: "Oct 08, 2026 • 07:45 PM",
  },
  {
    id: "file-6",
    name: "Algorithms_Cheatsheet_Dynamic_Prog.png",
    folder: "General Studies",
    type: "image",
    size: "1.4 MB",
    sizeBytes: 1468006,
    updatedAt: "Oct 05, 2026 • 03:15 PM",
  },
  {
    id: "file-7",
    name: "campus_resume_aditya_sharma_2026.pdf",
    folder: "Career & Resumes",
    type: "pdf",
    size: "320 KB",
    sizeBytes: 327680,
    updatedAt: "Oct 02, 2026 • 02:10 PM",
  },
  {
    id: "file-8",
    name: "Relational_Algebra_Cheatsheet.pdf",
    folder: "Reference Cheatsheets",
    type: "pdf",
    size: "3.2 MB",
    sizeBytes: 3355443,
    updatedAt: "Sep 28, 2026 • 10:00 AM",
  },
];

export function getSavedPrivateFiles() {
  if (typeof window === "undefined") return privateFilesData;
  try {
    const raw = localStorage.getItem("campushub_private_files");
    return raw ? JSON.parse(raw) : privateFilesData;
  } catch (e) {
    return privateFilesData;
  }
}

export function savePrivateFilesToStorage(files) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("campushub_private_files", JSON.stringify(files));
  } catch (e) {
    console.error("Failed to save private files", e);
  }
}

export function getSavedFolders() {
  if (typeof window === "undefined") return defaultFolders;
  try {
    const raw = localStorage.getItem("campushub_private_folders");
    return raw ? JSON.parse(raw) : defaultFolders;
  } catch (e) {
    return defaultFolders;
  }
}

export function saveFoldersToStorage(folders) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("campushub_private_folders", JSON.stringify(folders));
  } catch (e) {
    console.error("Failed to save private folders", e);
  }
}

export const activityFeed = [
  {
    id: "act-1",
    title: "Assignment Submitted",
    detail: "SQL Queries & Joins • CS-304",
    time: "2 hours ago",
    type: "submission",
  },
  {
    id: "act-2",
    title: "Grade Released: OS Midterm",
    detail: "Prof. Marcus Vance graded your script",
    scoreBadge: "92/100",
    time: "Yesterday, 4:15 PM",
    type: "grade",
  },
  {
    id: "act-3",
    title: "New Lecture Material Added",
    detail: "CSS Grid, Flexbox & Tailwind Architecture",
    time: "Oct 18, 10:00 AM",
    type: "material",
  },
  {
    id: "act-4",
    title: "Quiz Scheduled",
    detail: "Relational Algebra Quiz 3 scheduled for Oct 24",
    time: "Oct 17, 03:00 PM",
    type: "quiz",
  },
];
