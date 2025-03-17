
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

});

function averageData() {
    
    if (!isNaN(document.getElementById("task2").value.trim()) && document.getElementById("task2").value.trim()){
        const map1 = new Map();  
        const user = auth.currentUser;
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

        if (!user) {
            console.log("No user is signed in");
            return;
        }

        const userID = user.uid;
        const userTasksRef = db.collection("users").doc(userID).collection("total");

    
        userTasksRef.get().then((snapshot) => {
            const totalDocs = snapshot.size;  //# of days
            if (totalDocs === 0) {
                console.log("No tasks available for this user.");
                return;
            }

            snapshot.forEach((doc) => {
                const taskData = doc.data();
                for (const [taskName, taskInfo] of Object.entries(taskData)) {
                    const currentSum = map1.get(taskName) || 0;
                    map1.set(taskName, currentSum + taskInfo);
                }
            });

            let i = 0;
            let sum1 = 0;
            map1.forEach((sum, taskName) => {
                const realav = (sum/totalDocs).toFixed(7);
                const average = (sum/totalDocs).toFixed(1);
                const li = document.createElement("li");
                const yearsleft = 90-document.getElementById("task2").value;
               
                li.innerHTML = `You will spend <span class="blue-text">${(realav/24*yearsleft).toFixed(1)}</span> years ${taskName} (${(100*realav/24).toFixed(2)}%)`;

                document.getElementById("avlist").appendChild(li);
                console.log(`${taskName} average is ${average}`);
                xValues.push(taskName);
                yValues.push(average);
                newBarColors.push(barColors[i % barColors.length]);
                i++;
                sum1+= Number(average);
            });

            


            if (window.myPieChart) {
                window.myPieChart.destroy();
            }

            const ctx = document.getElementById("myChart");
            Chart.register(ChartDataLabels);

            window.myPieChart = new Chart(ctx, {
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
                    plugins: {
                        datalabels: {
                            color: "white",
                            anchor: "end",
                            align: "start",
                            font: {
                                weight: "bold",
                                size: 10
                            },
                            formatter: (value, ctx) => {
                                // Get the chart's total sum
                                const total = ctx.chart.data.datasets[0].data.reduce((acc, val) => acc + parseFloat(val), 0);
                                const percentage = (value / total) * 100; // Calculate percentage

                                // Only show labels if segment is big enough (> 5% of the pie)
                                if (percentage > 5) {
                                    let label = ctx.chart.data.labels[ctx.dataIndex];
                                    return `${label}: ${value}`;
                                }
                                return ""; // Hide label if segment is too small
                            }
                        }
                    }
                }
            });
            
        }).catch((error) => {
            console.error("Error getting documents: ", error);
        });
    }
    else{
        alert("Enter your age!");
    }
}

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
        
    } else {
        loginButton.innerText = "Login";
       
    }

}

auth.onAuthStateChanged(user => {
    console.log("Auth state changed:", user);
    updateUI(user);

});

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