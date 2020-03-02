const {getAllFilePathsWithExtension, readFile} = require('./fileSystem');
const {readLine} = require('./console');
const path = require('path');
const regexp = /\/\/\W*todo\W*/i;

const files = getFiles();

console.log('Please, write your command!');
readLine(processCommand);

function getFileNameFromPath(pathFile) {
    return path.basename(`${pathFile}`);
}

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    const fileData = filePaths.map(function(pathFile){
        return {
            fileInfo: readFile(pathFile),
            fileName: getFileNameFromPath(pathFile),
        }
    });
    return fileData;
}

function processCommand(command) {
    let username = command.startsWith('user') ? command.slice(command.indexOf(' ') + 1) : null;
    let sortType = command.startsWith('sort') ? command.slice(command.indexOf(' ') + 1) : null;
    let date = command.startsWith('date') ? command.slice(command.indexOf(' ') + 1) : null;
    switch (command) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            console.log(showTable(getAllTodoFromFiles()));
            break;
        case 'important':
            console.log(showTable(getImportantTodo()));
            break;
        case `user ${username}`:
            console.log(showTable(getUserComment(username)));
            break;
        case `sort ${sortType}`:
            console.log(showTable(sortComment(sortType)));
            break;
        case `date ${date}`:
            console.log(showTable(showCommentAfterDate(date)));
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function getCommentsFromFile(str, fileName) {
    let stringsFile = str.split('\n');
    let arrayWithToDo = stringsFile.filter((elem) => (regexp.test(elem)));
    let arrayComments = arrayWithToDo.map((elem) => (elem.slice(elem.search(regexp)) + `; ${fileName}`));
    let arrayCommentsWithoutToDo = arrayComments.map((elem) => (elem.replace(regexp, '')));
    return arrayCommentsWithoutToDo;
}

function getAllTodoFromFiles() {
    let allTodo = [];
    for (let i = 0; i < files.length; i++ ) {
        allTodo.push(getCommentsFromFile(files[i].fileInfo, files[i].fileName));
    }
    return allTodo.reduce((acc, val) => acc.concat(val), []);
}

function isImportant(str) {
    return str.includes('!');
}

function getImportantTodo() {
    return getAllTodoFromFiles().filter(elem => isImportant(elem));;
}

function getUserName(str) {
    let userName = str.split(';')[0].trim();
    if (isNaN(Date.parse(userName))) return userName;
        else return null;
}

function isUserComment(str, username) {
    return getUserName(str) ? getUserName(str).toLowerCase() == `${username}`.toLowerCase() : null;
}

function getUserComment(username){
    return getAllTodoFromFiles().filter(elem => isUserComment(elem, username));
}

function getDate(str) {
    let firstElem = str.split(';')[0].trim();
    let secondElem = str.split(';')[1].trim();
    if (!isNaN(Date.parse(secondElem))) return secondElem;
        else if (!isNaN(Date.parse(firstElem))) return firstElem;
            else return null;
}

function showCommentAfterDate(date) {
    return getAllTodoFromFiles().filter(elem => Date.parse(getDate(elem)) >= Date.parse(date));
}

function getComment(str) {
    let comment = str.split(';')[str.split(';').length - 2].trim();
    return comment;
}

function getFileName(str) {
    let fileName = str.split(';')[str.split(';').length - 1].trim();
    return fileName;
}

function getCountSymbol(str, symb) {
    let count = 0;
    for (let char of str) {
        if (char == symb) count++;
      }
    return count;
}

function sortComment(sortType) {
    
    if (sortType == 'importance') return getAllTodoFromFiles().sort(function compare(a, b) {
        if (getCountSymbol(a, '!') > getCountSymbol(b, '!')) return -1;
        if (getCountSymbol(a, '!') < getCountSymbol(b, '!')) return 1;
        if (getCountSymbol(a, '!') == getCountSymbol(b, '!')) return 0;
      });

    if (sortType == 'user') return getAllTodoFromFiles().sort(function compare(a, b) {
        if ((getUserName(a) == null) && (getUserName(b) != null)) return 1;
        if ((getUserName(a) != null) && (getUserName(b) == null)) return -1;
        if (getUserName(a).toLowerCase() < getUserName(b).toLowerCase()) return -1;
        if (getUserName(a).toLowerCase() > getUserName(b).toLowerCase()) return 1;
        if (getUserName(a).toLowerCase() > getUserName(b).toLowerCase()) return 0;
    })
    
    if (sortType == 'date') return getAllTodoFromFiles().sort(function compare(a, b) {
        if ((getDate(a) == null) && (getDate(b) != null)) return 1;
        if ((getDate(a) != null) && (getDate(b) == null)) return -1;
        if (getDate(a) > getDate(b)) return -1;
        if (getDate(a) < getDate(b)) return 1;
        if (getDate(a) == getDate(b)) return 0;
    })
}

function showTable(arr) {
    if (arr.length == 0) return 'no elements';

    let maxWidthOfUser = getMaxWidthOfColumn(arr, getUserName, 10);
    let maxWidthOfComment = getMaxWidthOfColumn(arr, getComment, 50);
    let maxWidthOfFileName = getMaxWidthOfColumn(arr, getFileName, 15);
    
    let table = arr.map(function(comment) {
        let userNameInColumn = getElementInColumn(getUserName, comment, 10, maxWidthOfUser);
        let commentInColumn = getElementInColumn(getComment, comment, 50, maxWidthOfComment);
        let fileNameInColumn = getElementInColumn(getFileName, comment, 15, maxWidthOfFileName);

        let firstColumn = isImportant(comment) ? '  !  |' : '     |';
        let secondColumn = getUserName(comment) ? `  ${userNameInColumn}  |` : '  ' + ''.padEnd(maxWidthOfUser) + '  |';
        let thirdColumn = getDate(comment) ? `  ${getDate(comment)}  |` : '              |';
        let fourthColumn = `  ${commentInColumn}  |`;
        let fifthColumn = `  ${fileNameInColumn}  |`;
        let resultStr = firstColumn + secondColumn + thirdColumn + fourthColumn + fifthColumn;
        return resultStr;
    });

    let userTitle = '  user' + ''.padEnd(maxWidthOfUser - 2) + '|';
    let commentTitle = '  comment' + ''.padEnd(maxWidthOfComment - 5) + '|';
    let fileNameTitle = '  filename' + ''.padEnd(maxWidthOfFileName - 6) + '|';
    let tableTitle = '  !  |' + userTitle + '  date        |' + commentTitle + fileNameTitle;
    let separator = '-'.repeat(table[0].length);
    table.unshift(tableTitle, separator);
    table.push(separator);
    return table;
}

function getMaxWidthOfColumn(arr, func, width) {
    let maxWidth = 0;
    let getElement = func;
    arr.forEach(element => {
        if (getElement(element)) {
            if (getElement(element).length > width - 1) {
                maxWidth = width;
                return maxWidth;
            } else if (getElement(element).length > maxWidth) maxWidth = getElement(element).length;
        }
    });
    return maxWidth;
}

function getElementInColumn(func, elem, width, maxWidth) {
    let getElement = func;
    let result;
    if (getElement(elem)) {
        if (getElement(elem).length > width - 1) {
            result = getElement(elem).slice(0,width - 3) + '...';
        } else result = getElement(elem).padEnd(maxWidth);
    }
    return result;
}