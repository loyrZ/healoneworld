console.log("Javascript Loaded");
const form = document.getElementById("SignUp");

form.addEventListener("submit", function (event) {
    console.log("Event Listener Detetced");
    event.preventDefault();

    let valid = true;

    const Name = document.getElementById("Name").value.trim();
    const Email = document.getElementById("Email").value.trim();
    const Password = document.getElementById("Password").value;
    const ConfirmPassword = document.getElementById("ConfirmPassword").value;

    document.querySelectorAll("small").forEach(error => {
        error.textContent = "";
    })

    if(Name == ""){
        document.getElementById("NameError").textContent = "Name is Required";
        valid = false;
    }

    if(!Email.includes("@")){
        document.getElementById("EmailError").textContent = "Submit a Valid Email Address";
        valid = false;
    }

    if (Password.length < 8){
        document.getElementById("PasswordError").textContent = "Password Must be atleast 8 Characters";
        valid = false;
    }

    if(Password !== ConfirmPassword){
        document.getElementById("ConfirmPasswordError").textContent = "Passwords Do Not Match";
        valid = false;
    }

    if (valid) {
        document.getElementById("SuccessMessage").textContent = "SignUp Information is Correct";
    }
});