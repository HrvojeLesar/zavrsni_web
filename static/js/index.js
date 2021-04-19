const textArea = document.getElementById("input-area");
const submitButton = document.getElementById("submit");
const solutionDiv = document.getElementById("solution");
const table = document.getElementById("solution-table");
const minSelection = document.getElementById("min");
const maxSelection = document.getElementById("max");

let placeholder = "Primjer unosa:\n1 2 3\n2 4 6\n3 6 9";
textArea.setAttribute('placeholder', placeholder);

const test = [
    [1, 2, 3],
    [2, 4, 6],
    [3, 6, 9]
];

let lastSentRequest = {};

submitButton.addEventListener("click", function() {
    let matrix = parseInput();
    solutionDiv.textContent = "";
    solutionDiv.style.color = "black";
    table.innerHTML = "";
    if (typeof(matrix) === "string") {
        solutionDiv.style.color = "red";
        solutionDiv.textContent = matrix;
        return;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    
    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            if (this.status === 200) {
                submitButton.removeAttribute("disabled");
                solutionDiv.style.color = "black";
                let responseJson = JSON.parse(this.responseText);
                if (lastSentRequest.max) {
                    solutionDiv.textContent = "Maksimalni profit: " + responseJson.result;
                } else {
                    solutionDiv.textContent = "Minimalni trošak: " + responseJson.result;
                }
                displayTable(responseJson);
            }
            if (this.status === 413) {
                solutionDiv.style.color = "red";
                solutionDiv.textContent = "Dogodila se greška kod slanja matrice!\nPokušajte poslati manju matricu!";
                submitButton.removeAttribute("disabled");
            }
        }
    });
    
    xhr.open("POST", "./hung");
    xhr.setRequestHeader("Content-Type", "application/json");
    
    let request = {
        max: isMaxProblem(),
        problem: matrix,
    };

    lastSentRequest = request;
    submitButton.setAttribute("disabled", true);
    xhr.send(JSON.stringify(request));
});

function isMaxProblem() {
    if (maxSelection.checked) {
        return true;
    } else {
        return false;
    }
}

function parseInput() {
    let value = textArea.value;
    let matrix = [];

    let rows = value.split("\n");
    if (rows[rows.length - 1].trim() == "") {
        rows.pop();
    }

    for (let i = 0; i < rows.length; i++) {
        matrix.push([]);
        let elements = rows[i].split(/\s/);
        for (el of elements) {
            if (el == "") { continue; }
            let numEl = Number(el);
            if (isNaN(numEl)) {
                return "Svi elementi matrice moraju biti brojevi!";
            }
            matrix[i].push(numEl);
        }
    }

    if (matrix.length == 0) {
        return "Matrica nije unesena!";
    }

    return matrix;
}

function displayTable(responseJson) {
    for (let i = -1; i < responseJson.original_problem.length; i++ ) {
        let newRow = document.createElement("tr");
        for (let j = -1; j < responseJson.original_problem.length; j++) {
            // create headings
            if (i == -1) {
                let tableHeading = document.createElement("th");
                if (j != -1) {
                    tableHeading.textContent = j + 1 + ".";
                }
                newRow.appendChild(tableHeading);
            } else if (j == -1) {
                let tableHeading = document.createElement("th");
                tableHeading.textContent = i + 1 + ".";
                newRow.appendChild(tableHeading);
            } else {
                let tableData = document.createElement("td");
                let bold = document.createElement("b");
                console.log(i + " " + j + " " + responseJson.assigned_positions[i][j]);
                if (responseJson.assigned_positions[i][j] == 1) {
                    bold.innerText = responseJson.original_problem[i][j];
                    tableData.appendChild(bold);
                } else {
                    tableData.textContent = responseJson.original_problem[i][j];
                }
                newRow.appendChild(tableData);
            }
            table.appendChild(newRow);
        }
    }
}


function checkAssigned(row, col, responseJson) {
    for (let i = 0; i < responseJson.assigned_positions.length; i++) {
        if (responseJson.assigned_positions[i][0] == row && responseJson.assigned_positions[i][1] == col) {
            return true;
        }
    }
    return false;
}