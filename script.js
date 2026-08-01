let username = "ashley";
let heartCount = 0;
let heartCountDisplay = document.getElementById("heartCount");
let postButton = document.getElementById("postButton");
let outfitName = "leather jacket fit";

console.log(`Outfit: ${outfitName}`);

function sayHello() {
    console.log(`Hello, ${username}!`);
}

function incrementHearts() {
    heartCount++;
    heartCountDisplay.textContent = `Hearts: ${heartCount}`;

    if (heartCount >= 10) {
        console.log("Popular fit!");
    } else {
        console.log("New fit!");
    }
}

postButton.addEventListener("click", function() {
    incrementHearts();
});

