// 1) ALL VARIABLES
let signInButton = document.getElementById("signInButton");
let signUpButton = document.getElementById("signUpButton"); 

let username = ""
let password = ""

let postButton = document.getElementById("addPostButton");
let profileGrid = document.getElementById("profileGrid");
let posts = [];

let submitPostButton = document.getElementById("submitPostButton");
let imageInput = document.getElementById("imageInput");
let imagePreview = document.getElementById("imagePreview");
let selectedImage = null;

let feedContainer = document.getElementById("feed");

// 2) ALL FUNCTIONS
function showScreen(screenId) {
    let screens = document.getElementsByClassName("screen");

    // hide all of them first
    for (let i = 0; i < screens.length; i++) {
        screens[i].classList.remove("active");
    }

    if (screenId === "profile") {
        renderProfile();
    }

    if (screenId === "newPost") {
        resetPostForm();
    }

    document.getElementById(screenId).classList.add("active");
}

function signIn() {
    let inputVal = document.getElementById("usernameSignIn").value.trim();
    username = inputVal !== "" ? inputVal : "Guest";
    password = document.getElementById("passwordSignIn").value;
    saveData();
}

function resetPostForm() {
    selectedImage = null;
    imageInput.value = "";
    imagePreview.src = "";
    imagePreview.style.display = "none";
    document.getElementById("newCaptionInput").value = "";
}

function createPost() {
    let newCaption = document.getElementById("newCaptionInput").value;

    let post = {
        caption: newCaption,
        hearts: 0,
        img: selectedImage
    };
    posts.push(post);
    saveData();
}

function renderProfile() {
    profileGrid.innerHTML = "";

    document.getElementById("displayUsername").textContent = username;

    for (let i = 0; i < posts.length; i++) {
        let post = posts[i];
        
        let postImage = document.createElement("img");
        postImage.src = post.img;
        postImage.alt = post.caption;

        // heartButton.textContent = `❤️ ${post.hearts}`;
        // heartButton.addEventListener("click", function() {
        //     incrementHeart(i);
        //     heartButton.textContent = `❤️ ${post.hearts}`;
        // });

        profileGrid.appendChild(postImage);
    }
}

function incrementHeart(postIndex) {
    posts[postIndex].hearts++;
    console.log(`Post ${postIndex} has ${posts[postIndex].hearts} hearts.`);
}

function saveData() {
    let data = {
        username: username,
        posts: posts
    };

    localStorage.setItem("ootidifyData", JSON.stringify(data));
}

function loadData() {
    let saved = localStorage.getItem("ootidifyData");
    if (saved) {
        let data = JSON.parse(saved);
        username = data.username;
        posts = data.posts;
        return true;
    }
    return false;
}
// 3) INITIALIZE
showScreen("loading");

setTimeout(function() {
    // if (loadData()) {
    //     showScreen("profile");
    // } else {
    //     showScreen("login");
    // }
    showScreen("login");
}, 3000);

signInButton.addEventListener("click", function() {
    signIn();
    showScreen("profile");
});

postButton.addEventListener("click", function() {
    showScreen("newPost");
});

imageInput.addEventListener("change", function(event) {
    let img = imageInput.files[0];
    let reader = new FileReader();

    reader.onload = function(e) {
        selectedImage = reader.result;

        let imagePreview = document.getElementById("imagePreview");
        imagePreview.src = selectedImage;
        imagePreview.style.display = "block";
    };
    reader.readAsDataURL(img);
});

submitPostButton.addEventListener("click", function() {
    createPost();
    resetPostForm();
    showScreen("profile");    
});




