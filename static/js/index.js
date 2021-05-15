const textArea = document.getElementById("input-area");
const submitButton = document.getElementById("submit");

const table = document.getElementById("solution-table");
const minSelection = document.getElementById("min");
const maxSelection = document.getElementById("max");
const matrixRowDimCell = document.getElementById("cells-input-matrix-rows");
const matrixColumnDimCell = document.getElementById("cells-input-matrix-columns");
const cellInputTable = document.getElementById("cells-input-table");
const switchInputTypeButton = document.getElementById("switch-input-type");

const inputTextBoxView = document.getElementById("textbox-input");
const inputCellView = document.getElementById("cells-input");

const inputErrorMessage = document.getElementById("input-error-message");
const solutionContainer = document.getElementById("solution-container");

const solutionMessage = document.getElementById("solution-message");
const solutionValue = document.getElementById("solution-value");

const solutionTableParent = document.getElementById("solution-table-parent");
const solutionTextParent =  document.getElementById("solution-text-parent");
const solutionTextArea = document.getElementById("solution-textarea");

// const gen = document.getElementById("gen");

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
    inputErrorMessage.textContent = "";
    inputErrorMessage.style.color = "black";

    solutionMessage.textContent = "";
    solutionValue.textContent = "";
    solutionTextArea.value = "";
    table.innerHTML = "";

    if (typeof(matrix) === "string") {
        inputErrorMessage.style.color = "red";
        inputErrorMessage.textContent = matrix;
        return;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    
    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            if (this.status === 200) {
                submitButton.removeAttribute("disabled");
                solutionContainer.style.display = "block";
                solutionMessage.style.color = "black";
                let responseJson = JSON.parse(this.responseText);

                if (responseJson.error != undefined) {
                    solutionMessage.textContent = "Prošlo je dozvoljeno maksimalno vrijeme rješavanja! (10s)";
                    solutionMessage.style.color = "red";
                    return;
                }

                if (responseJson.result == -1) {
                    solutionMessage.textContent = "Dogodila se greška kod rješavanja zadane matrice!";
                    solutionMessage.style.color = "red";
                    return;
                }

                if (lastSentRequest.max) {
                    solutionMessage.textContent = "Maksimalni profit: ";
                } else {
                    solutionMessage.textContent = "Minimalni trošak: ";
                }
                solutionValue.textContent = responseJson.result;
                displayTable(responseJson);
                fillSolutionTextArea(responseJson);
                //  gen.click();
                //  submitButton.click();
            }
            if (this.status === 413) {
                solutionMessage.style.color = "red";
                solutionMessage.textContent = "Dogodila se greška kod slanja matrice!\nPokušajte poslati manju matricu!";
                submitButton.removeAttribute("disabled");
            }
        }
    });
    
    if (document.getElementById("hung").checked) {
        xhr.open("POST", "./hung");
    } else {
        xhr.open("POST", "./hung-munkres");
    }
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
    let matrix = [];

    if (inputTextBoxView.style.display != "none") {
        let value = textArea.value;
    
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
    } else {
        let inputError = false;
        for (let i = 0; i < cellInputTable.dataset.rows; i++) {
            matrix.push([]);
            let row = cellInputTable.children[i];
            for (let j = 0; j < cellInputTable.dataset.columns; j++) {
                let cell = row.children[j];
                let inputCellValue = Number(cell.children[0].value);
                if (isNaN(inputCellValue)) {
                    cell.children[0].style.background = "#fc5d5d";
                    inputError = true;
                } else {
                    cell.children[0].style.background = "white";
                    matrix[i].push(inputCellValue);
                }
            }
        }

        if (inputError) {
            return "Svi elementi matrice moraju biti brojevi!";
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
                if (responseJson.assignment_mask[i][j] == 1) {
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

function fillSolutionTextArea(responseJson) {
    solutionTextArea.value = "";
    for (let i = 0; i < responseJson.original_problem.length; i++) {
        for (let j = 0; j < responseJson.original_problem.length; j++) {
            if (responseJson.assignment_mask[i][j] == 1) {
                solutionTextArea.value += `Radnik [${i + 1}] raspoređen na posao [${j + 1}]. Vrijednost [${responseJson.original_problem[i][j]}].\n`;
            }
        }
    }
}


function checkAssigned(row, col, responseJson) {
    for (let i = 0; i < responseJson.assignment_mask.length; i++) {
        if (responseJson.assignment_mask[i][0] == row && responseJson.assignment_mask[i][1] == col) {
            return true;
        }
    }
    return false;
}

// gen.addEventListener("click", function() {
// 	let max = 100;
//     let out = "";
//     for (let i = 0; i < max; i++) {
//         for (let j = 0; j < max; j++) {
//             out += Math.floor(Math.random() * 50 + 1) + " ";
//         }
//         out += "\n";
//     }
//     textArea.value = out;
// });

function createInitialCellsTable() {
    let rows = Number(matrixRowDimCell.value);
    let cols = Number(matrixColumnDimCell.value);

    for (let i = 0; i < rows; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < cols; j++) {
            row.appendChild(createEmptyCell(i, j));
        }
        cellInputTable.appendChild(row);
        cellInputTable.dataset.rows = rows;
        cellInputTable.dataset.columns = cols;
    }
}

function createEmptyCell(row, col) {
    let emptyCell = document.createElement("td");
    let inputCell = document.createElement("input");
    inputCell.classList.add("cell");
    inputCell.type = "text";
    inputCell.id = `cell-${row}-${col}`;
    inputCell.autocomplete = "off";
    emptyCell.appendChild(inputCell);
    return emptyCell;
}

function updateRows() {
    let rows = Number(matrixRowDimCell.value);
    if (isNaN(rows)) { return; }
    if (rows == cellInputTable.dataset.rows) { return; }
    if (rows > cellInputTable.dataset.rows) {
        for (let i = cellInputTable.dataset.rows; i < rows; i++) {
            let row = document.createElement("tr");
            for (let j = 0; j < cellInputTable.dataset.columns; j++) {
                row.appendChild(createEmptyCell(i, j));
            }
            cellInputTable.appendChild(row);
        }
    } else {
        for (let i = cellInputTable.dataset.rows - 1; i >= rows; i--) {
            let row = cellInputTable.childNodes[i];
            cellInputTable.removeChild(row);
        }
    }
    cellInputTable.dataset.rows = rows;
}

function updateColumns() {
    let columns = Number(matrixColumnDimCell.value);
    if (isNaN(columns))  { return; }
    if (columns == cellInputTable.dataset.columns) { return; }
    if (columns > cellInputTable.dataset.columns) {
        for (let i = 0; i < cellInputTable.dataset.rows; i++) {
            for (let j = cellInputTable.dataset.columns; j < columns; j++) {
                cellInputTable.childNodes[i].appendChild(createEmptyCell(i, j));
            }
        }
    } else {
        for (let j = cellInputTable.dataset.columns - 1; j >= columns; j--) {
            for (let i = 0; i < cellInputTable.dataset.rows; i++) {
                let row = cellInputTable.childNodes[i];
                let rows_child_element = row.childNodes[j];
                row.removeChild(rows_child_element);
            }
        }
    }
    cellInputTable.dataset.columns = columns;
}

matrixRowDimCell.addEventListener("keyup", updateRows);
matrixRowDimCell.addEventListener("blur", updateRows);
matrixColumnDimCell.addEventListener("keyup", updateColumns);
matrixColumnDimCell.addEventListener("blur", updateColumns);


function inputType(type) {
    switch (type) {
        case "cells": {
            inputTextBoxView.style.display = "none";
            inputCellView.style.display = "block";
            break;
        }
        case "quick": {
            inputTextBoxView.style.display = "block";
            inputCellView.style.display = "none";
            break;
        }
    }
}

function showModal(modal) {
    console.log(modal);
    modal = document.getElementById(modal);
    console.log(modal);
    modal.style.display = "block";
}

function closeModal(modal) {
    modal.parentElement.parentElement.style.display = "none";
}

window.addEventListener("click", function(event) {
    if (event.target.classList == "modal") {
        event.target.style.display = "none";
    }
});

function showSelectedView(executor) {
    if (executor.classList.contains("active")) {
        return;
    }

    for (let child of executor.parentElement.children) {
        child.classList.remove("active");
    }
    executor.classList.add("active");

    switch (executor.id) {
        case "tab-table-display": {
            solutionTableParent.style.display = "block";
            solutionTextParent.style.display = "none";
            break;
        }
        
        case "tab-text-display": {
            solutionTextParent.style.display = "block";
            solutionTableParent.style.display = "none";
            break;
        }
    }
}

createInitialCellsTable();