console.log("Autofill script loaded");

setTimeout(() => {

  let inputs = document.querySelectorAll("input");

  console.log("Inputs found:", inputs.length);

  inputs.forEach((input) => {

    let label = input.placeholder || input.name || "";

    if(label.toLowerCase().includes("first")){
        input.value = "John";
    }

    if(label.toLowerCase().includes("last")){
        input.value = "Doe";
    }

    if(label.toLowerCase().includes("email")){
        input.value = "john.doe@example.com";
    }

    input.dispatchEvent(new Event("input",{bubbles:true}));

  });

},3000);