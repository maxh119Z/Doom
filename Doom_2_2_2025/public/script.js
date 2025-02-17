// Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyBWTBXLPQAUsSbnKRO12plCujj_RbJl4Tw",
    authDomain: "doom-9a78a.firebaseapp.com",
    projectId: "doom-9a78a",
    storageBucket: "doom-9a78a.firebasestorage.app",
    messagingSenderId: "887901792528",
    appId: "1:887901792528:web:4591e307acc9daa3171d95",
    measurementId: "G-NQ0Z9LBCCC"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let totalhours = 0;

const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", event => {
    const app = firebase.app();
    console.log("Firebase App Initialized:", app);

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    document.getElementById("currentday").innerHTML = today;
    console.log("current day: " + today);
});

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => console.log("Auth state persistence set to LOCAL."))
    .catch(error => console.error("Error setting persistence:", error));

function handleAuth() {
    const user = auth.currentUser;

    if (user) {
        auth.signOut().then(() => {
            console.log("User logged out.");
           
        }).catch(error => console.error("Logout Error:", error));
    } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(result => {
                console.log("User signed in:", result.user);
                saveUserToFirestore(result.user);
            })
            .catch(error => alert(`Error: ${error.message}`));
    }
}

function updateUI(user) {
    const loginButton = document.getElementById("loginbutton");
    if (user) {
        loginButton.innerText = "Logout";
        document.getElementById("taskList").innerHTML = ""; 
        loadTasks(user.uid);
    } else {
        loginButton.innerText = "Login";
        document.getElementById("taskList").innerHTML = ""; 
    }
}

auth.onAuthStateChanged(user => {
    console.log("Auth state changed:", user);
    updateUI(user);
    //hoursLeft(user.uid);
});

//when you new user
function saveUserToFirestore(user) {
   
    const userRef = db.collection("users").doc(user.uid);

    userRef.set({
        email: user.email,
        name: user.displayName
    }, { merge: true }) 
    .then(() => {
        let newguy = false;
        console.log("User data saved successfully.");
        const userTasksRef = db.collection("users").doc(user.uid).collection("tasks");

        let settaskdaily = userTasksRef.doc("daily").get().then((doc) => {
            //set some basic tasks
            if (!doc.exists) {
                userTasksRef.doc("daily").set({
                    ["Sleeping"]: 7,
                    ["School+Schoolwork"]:7,
                    ["Phone Usage"]: 3,
                    ["Extra Work"]: 2,
                    ["Eating"]: 2,
                    ["Excercise"]: 2,
                    ["Other"]:1,
                    ["Hygiene"]: 1
                });
                newguy = true;
            }
      
        });


        Promise.all([settaskdaily])
        .then(() => {
            if (newguy){
                console.log("Updated daily and today tasks successfully!");
                loadTasks(user.uid)
            }
            
        })
    }).catch(error => console.error("Error saving user:", error));

}

function addTask() {
    const user = auth.currentUser;
    if (!user) {
        alert("Please log in first!");
        return;
    }

    const taskName = document.getElementById("task").value.trim();
    if (!taskName) {
        alert("Please enter a valid task and hours!");
        return;
    }

    const userTasksRef = db.collection("users").doc(user.uid).collection("tasks").doc("today");

    userTasksRef.set({
        [taskName]: 0
    }, { merge: true })
    .then(() => {
        console.log("Task added successfully!");
        makeTask(taskName, "today", 0);

    })
    .catch(error => console.error("Error adding task:", error));
}

function addDaily() {
    const user = auth.currentUser;
    if (!user) {
        alert("Please log in first!");
        return;
    }

    const taskName = document.getElementById("task").value.trim();
    if (!taskName) {
        alert("Please enter a valid task and hours!");
        return;
    }

    const userTasksRef = db.collection("users").doc(user.uid).collection("tasks").doc("daily");

    userTasksRef.set({
        [taskName]: 0 //task Hours here
    }, { merge: true })
    .then(() => {
        console.log("Task added successfully!");
        makeTask(taskName, "daily", 0);
    })
    .catch(error => console.error("Error adding task:", error));
}

function loadTasks(userId) {
    const taskList = document.getElementById("taskList");
    const user = auth.currentUser;
    taskList.innerHTML = "";

    const userTasksRef = db.collection("users").doc(userId).collection("tasks");
    totalhours = 0;

    let du = userTasksRef.doc("daily").get().then(doc => {
        if (doc.exists) {
            let taskData = doc.data();
            for (const [taskName, taskInfo] of Object.entries(taskData)) {
                let taskHours;
                taskHours = taskInfo;
                console.log(taskHours);

                totalhours += displayTasks({ [taskName]: taskInfo }, "daily", taskHours);
            }
        }
    });
    
    let tu = userTasksRef.doc("today").get().then(doc => {
        if (doc.exists) {
            let taskData = doc.data();
    
            for (const [taskName, taskInfo] of Object.entries(taskData)) {
                let taskHours;
                taskHours = taskInfo;
                console.log(taskHours);
    
                totalhours += displayTasks({ [taskName]: taskInfo }, "today", taskHours);
            }
        }
    });
    
    Promise.all([tu, du])
    .then(() => {
        document.getElementById("hoursleft").innerHTML = `${24-totalhours} Hours Left in Day`;
        hoursLeft(user.uid);
    })
    .catch(error => {
        console.error("Error updating tasks:", error);
    });
}

function displayTasks(tasks, category, h) {
    const user = auth.currentUser;
    const taskList = document.getElementById("taskList");

    
    let totalhere = 0;
    for (const [task, hours] of Object.entries(tasks)) {
        makeTask(task, category,hours);
        totalhere += hours;
    }
    return totalhere;
}

function makeTask(task, category,h){
    const user = auth.currentUser;
    const li = document.createElement("span");
    li.setAttribute('data-task-name', task);  // Store taskName in the li element
    let input1 = document.createElement("input");
    input1.className = "input1";
    input1.type = "range";
    input1.value = h;
    input1.min = 0;
    input1.max = 24;
    input1.step = 0.5;

    const hourtext = document.createElement("p");
    hourtext.innerHTML = h;

        input1.addEventListener("input", () => {
            hourtext.innerHTML = input1.value;
            li.innerHTML = `<strong>${category}</strong>: ${task} - ${hourtext.innerHTML} hrs`;
           
        });

        input1.addEventListener("mouseup", () => {
         
                console.log("You stopped scrolling, adding values");

                const taskName = li.getAttribute('data-task-name');  // Get taskName from the li element
                const user = auth.currentUser;
                const userTasksRef = db.collection("users").doc(user.uid).collection("tasks");

                let dailyUpdate = userTasksRef.doc(category).get().then(doc => {
                    if (doc.exists && doc.data().hasOwnProperty(taskName)) {
                        return userTasksRef.doc(category).set({
                            [`${taskName}`]: Number(hourtext.innerHTML)
                        }, { merge: true });
                    }
                });


                Promise.all([dailyUpdate])
                    .then(() => {
                        console.log("Updated daily and today tasks successfully!");
                        hoursLeft(user.uid);
                    })
                    .catch(error => {
                        console.error("Error updating tasks:", error);
                    });
        });

        li.innerHTML = `<strong>${category}</strong>: ${task} - ${hourtext.innerHTML} hrs`;

        const button = document.createElement('button');

        button.innerHTML = "X";
        let textContainer = document.createElement("div");
        textContainer.classList.add("text-container");
            
        button.addEventListener("click", async () => {
            textContainer.remove();
            input1.remove();
            const todayDocRef = db.collection("users").doc(user.uid).collection("tasks").doc(category);
        
            try {
                await todayDocRef.update({
                    [task]: firebase.firestore.FieldValue.delete()
                });
                console.log(`Task "${task}" deleted successfully.`);
                
                hoursLeft(user.uid);
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        });
        
       
        textContainer.appendChild(li);
        textContainer.appendChild(button);
        
        taskList.appendChild(textContainer);

        taskList.appendChild(input1);
}

function hoursLeft(userId) {
    const userTasksRef = db.collection("users").doc(userId).collection("tasks");
    let totalhour1 = 0;

    let promises = [
        userTasksRef.doc("daily").get(),
        userTasksRef.doc("today").get()
    ];
    var xValues =[];
    var yValues = [];
    var barColors = [
        "#003f5c", // Deep Navy Blue  
        "#2f6690", // Steel Blue  
        "#247ba0", // Ocean Blue  
        "#0081a7", // Teal Blue  
        "#00afb9", // Bright Aqua  
        "#5c6bc0", // Soft Indigo  
        "#3949ab", // Royal Blue  
        "#7b2cbf", // Deep Violet  
        "#4a4e69", // Slate Blue  
        "#80ffdb"  // Neon Cyan  
      ];
      
      
      
    var newBarColors = [];

    Promise.all(promises).then(docs => {
        docs.forEach(doc => {
            if (doc.exists) {
                let taskData = doc.data();
                let i = 0;
                for (const [taskName, taskInfo] of Object.entries(taskData)) {
                    console.log(taskInfo);
                    totalhour1 += taskInfo;
                    xValues.push(taskName);
                    yValues.push(taskInfo);
                    newBarColors.push(barColors[i % barColors.length]);
                    i++;
                }
            }
        });
       

        document.getElementById("hoursleft").innerHTML = `${24 - totalhour1} Hours Left in Day`;
        if (24-totalhour1>0){
            xValues.push("Free Time");
            
            yValues.push(24-totalhour1);
            newBarColors.push("rgba(0,0,0,0.8)");
        }
        

        for (let i = 0; i< yValues.length;i++){
            yValues[i] = Math.round(yValues[i]);
        }
        if (window.myPieChart) {
            window.myPieChart.destroy();
        }
        window.myPieChart = new Chart("myChart", {
            type: "pie",
            data: {
                labels: xValues,
                datasets: [{
                    backgroundColor: newBarColors,
                    data: yValues 
                }]
            },
            options: {
                maintainAspectRatio: false,
                title: {
                    display: true,
                    text: "Your Time Left in a Day"
                }
            }
        });
        
    }).catch(error => {
        console.error("Error fetching tasks:", error);
    });
}

