var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

//캔버스 크기 지정
let w=1000,h=1500;
canvas.width=w;
canvas.height=h;
var strokeSize = 1;

const GRID_X = 5; //default : 5
const GRID_Y = 9; //default : 9

var isDarkmode = 0;

var favList = []

//캔버스 기본배경
ctx.fillStyle="white";
ctx.fillRect(0,0,w,h);

var selectedBuilding = '어의관'
var selectedLect = '?'

/**건물 선택창 함수*/
function setBuildingSelect(){
  let buildingArr=[];
  for(let i = 0; i < classroominfo.records; i++){
    let temp = classroominfo.rows[i];
    if(temp.BLDG_COUM == null) continue;
    let classArrtemp = (temp.BLDG_COUM).slice(0,-1);
    let temp2 = extractBuildingNames(classArrtemp);
    //console.log(classArrtemp)
    buildingArr.push(...temp2);
  }
  let sortedBuildingArr = [...(new Set(buildingArr))];
  //console.log(sortedBuildingArr)
  
  for(let i = 0; i < sortedBuildingArr.length; i++){
    let tempbuil = sortedBuildingArr[i];
    let tag = document.getElementById('building');
    tag.insertAdjacentHTML("beforeend", `<option value="${tempbuil}">${tempbuil}</option>`);
  }
}

/**강의실 선택창 함수*/
function setLectureSelect(building){
  selectedBuilding = building;
  let lectureArr = [];
  for(let i = 0; i < classroominfo.records; i++){
    let temp = classroominfo.rows[i];
    if(temp.BLDG_COUM == null) continue;
    let lectureStr = (temp.BLDG_COUM).slice(0,-1);

    if(lectureStr.startsWith(building)){
      let temp2 = extractRoomNumbers(lectureStr);
      lectureArr.push(...temp2);
    }
  }
  let sortedLectureArr = [...(new Set(lectureArr))].sort();

  document.getElementById('lect').innerHTML = '';

  let tag = document.getElementById('lect');
  tag.insertAdjacentHTML("beforeend", `<option>선택</option>`)
  for(let i = 0; i < sortedLectureArr.length; i++){
    let templect = sortedLectureArr[i];
    
    tag.insertAdjacentHTML("beforeend", `<option value="${templect}">${templect}</option>`);
  }
  //console.log(building, " : ", sortedLectureArr);
}

/**강의실 시간대를 관리하기 편한 json으로 변환 (챗지피티가 도와줌)*/
function extractDayRanges(input) {
  let regex = /(\w+)\((.*?)\)/g;
  let dayRanges = {};
  let match;
  while ((match = regex.exec(input)) !== null) {
      let day = match[1];
      let ranges = match[2].split(',').map(range => range.trim());
      if (!dayRanges[day]) {
          dayRanges[day] = [];
      }
      ranges.forEach(range => {
        let numbers = range.split('~').map(num => num.trim());
          if (numbers.length === 2) {
              if(numbers[0].endsWith('A')) numbers[0] = numbers[0].replace('A','.5')
              else if(numbers[0].endsWith('B')) numbers[0] = numbers[0].replace('B','.5')
              
              if(numbers[1].endsWith('A')){ numbers[1] = parseFloat(numbers[1].replace('A','.5'))-1;
                
              }
              else if(numbers[1].endsWith('B')) numbers[1] = numbers[1].replace('B','.5')
              dayRanges[day].push([numbers[0], numbers[1]]);
          } else if (numbers.length === 1) {
              // 단일 숫자 처리
              dayRanges[day].push([numbers[0]]);
          }
      });
  }
  return dayRanges;
}

/**예시 : "다빈치관-503-1 Techno Cube(테크노 큐브)-345" -> ["503-1","345"] (챗지피티가 도와줌)*/
function extractRoomNumbers(input) {
  // 정규식을 사용하여 '-' 뒤에 오는 숫자, 문자, 또는 숫자와 문자가 혼합된 부분을 추출
  let matches = input.match(/-\s*([A-Za-z0-9-]+)/g);
  // 추출된 문자열에서 '-'를 제거하고 배열로 반환
  return matches ? matches.map(match => match.replace('-', '').trim()) : [];
}

/**예시 : "다빈치관-503-1 Techno Cube(테크노 큐브)-345" -> ["다빈치관","Techno Cube(테크노 큐브)"] (챗지피티가 도와줌)*/
function extractBuildingNames(input) {
  let buildingNames = [];
  let regex = /(.*?)-([^\s]+)/g;
  let match;
  while ((match = regex.exec(input)) !== null) {
      buildingNames.push(match[1].trim());
  }
  return buildingNames;
}

/**예시 : "다빈치관-503-1 Techno Cube(테크노 큐브)-345" -> ["다빈치관-503-1","Techno Cube(테크노 큐브)-345"] (챗지피티가 도와줌)*/
function extractBuildingRooms(input) {
  let buildingRooms = [];
  let regex = /(\S.*?-\S+)(?=\s|$)/g;
  let match;
  while ((match = regex.exec(input)) !== null) {
      buildingRooms.push(match[1]);
  }
  return buildingRooms;
}

/**건물-강의실 형태로 입력된 강의실의 시간표 찾는 함수*/
function findScheduleOfClassroom(classroom){
  let arrtemp = [];
  for(let i = 0; i < classroominfo.records; i++){
    let classtemp = (classroominfo.rows[i].BLDG_COUM)?.slice(0,-1); //강의실 위치 가져옴
    if(classtemp == null || classtemp == null) continue;
    let classtemp2 = extractBuildingRooms(classtemp)
    //console.log(classtemp2)
    
    for(let j=0; j < classtemp2.length; j++){
      if (classtemp2[j] == classroom) {
        let subjtemp = classroominfo.rows[i];
        let lstmlist = subjtemp.LSTM_LIST_ENM;
        let lstmlistarr = lstmlist.split(', ')
        let dayRange = extractDayRanges(lstmlistarr);
        let jsontemp = {
          SUBJ_KNM: subjtemp.SUBJ_KNM, //한국어 강의제목
          SUBJ_ENM: subjtemp.SUBJ_ENM, //영어 강의제목
          SUBJ_CD: subjtemp.SUBJ_CD, //과목코드
          LECT_NUMB: subjtemp.LECT_NUMB, //강의실 번호
          schedule: dayRange //스케줄
        }
        arrtemp.push(jsontemp);
      }
    }
  }
  return arrtemp;
}

/**스케줄의 그리드 생성*/
function setScheduleGrid(){

  color = ["#000000", "#ffffff"][isDarkmode]

  for(let i = 0; i <GRID_Y; i++){ //가로선
    let height = h*3/100 + (h*97/100)*i/GRID_Y

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeSize;

    ctx.beginPath();
    ctx.moveTo(0,height);
    ctx.lineTo(w,height);
    ctx.closePath();
    ctx.stroke()
  }
  for(let i = 0; i < GRID_X; i++){ //세로선
    let width = w*4/100 + (w*96/100)*i/GRID_X

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeSize;

    ctx.beginPath();
    ctx.moveTo(width,0);
    ctx.lineTo(width,h);
    ctx.closePath();
    ctx.stroke()
  }

  for(let i = 0; i < GRID_Y; i++){ //시간
    let height = h*3/100 + (h*97/100)*i/GRID_Y+5
    let time = 9 + i;

    ctx.textBaseline = "top"
    ctx.textAlign = "right"
    ctx.fillStyle = color
    ctx.font = "25px NanumSquare bold"
    ctx.fillText((time-1)%12+1,w*4/100-5, height)
  }
  for(let i = 0; i < GRID_X; i++){ //날짜
    let width = w*4/100 + (w*96/100)*i/GRID_X + w*96/100/GRID_X/2

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = strokeSize;

    ctx.textBaseline = "bottom"
    ctx.textAlign = "center"
    ctx.fillStyle = color
    ctx.font = "28px NanumSquare bold"
    ctx.fillText(["월","화","수","목","금","토","일"][i],width, h*3/100-6)
  }
}

/**텍스트가 입력된 길이보다 길면 줄내림 하는 함수*/
function drawWrappedTextByCharacter(text, x, y, maxWidth, lineHeight) {
  let line = '';
  let currentY = y;

  for (let i = 0; i < text.length; i++) {
      const testLine = line + text[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && line !== '') {
          ctx.fillText(line, x, currentY);
          line = text[i];
          currentY += lineHeight;
      } else {
          line = testLine;
      }
  }
  // 마지막 줄 출력
  ctx.fillText(line, x, currentY);
  return currentY - y + lineHeight
}

function loadFavList(){
  let tab = document.getElementById('bookmarkList');
  tab.innerHTML="";
  
  for(let i = 0; i<favList.length; i++){
    let fav = favList[i]
    
    tab.insertAdjacentHTML("beforeend", `<div class="fav" onclick="loadFavFromList(this)">${fav.lect}</div>`);
  }
  
  localStorage.setItem('favList', JSON.stringify(favList))
  document.querySelectorAll('.fav').forEach(element => {
    element.style.color = ['black','white'][isDarkmode];
       
     })
};


/**입력된 lect와 selectedbuilding을 이용하여 강의실 시간표를 찾고 그리기 */
function setSchedule(lect){
  let classroom = selectedBuilding+'-'+lect;
  selectedLect = lect

  let color = ["#91ad60","#cf7368","#cda95b","#d8935c","#688fc6","#8a74bf","#6CB4A6","#67AE76","#B682CC"];
  let idx = 0;

  if(selectedLect != '?') document.getElementById('subjectTitle').innerText = classroom
  let classjson = findScheduleOfClassroom(classroom);
  console.log(classjson)



  ctx.fillStyle=["white","#171717"][isDarkmode];
  ctx.fillRect(0,0,w,h);
  
  for(let i = 0; i < favList.length; i++){
    //console.log('favList:',favList[i].lect)
    //console.log('selected:',selectedBuilding+'-'+selectedLect)
    if(favList[i].lect == selectedBuilding+'-'+selectedLect) {
      document.getElementById('star-checkbox').checked = true;
      //console.log(true)
      break;
    }
    else {
      document.getElementById('star-checkbox').checked = false
      //console.log(false)
    }
  }
  setScheduleGrid()
  let isLecting = 0;
  
  //ㅋㅋ코드 진짜 개판이네
  for(let i = 0; i < classjson.length; i++){
    let day = classjson[i].schedule //한 수업의 스케줄 가져옴
    let daykey = Object.keys(day) //그 스케줄의 요일들 가져옴
    
    //console.log(day)
    //console.log(daykey)
    //console.log('daykeylength :',daykey.length)
    for(let j=0; j < daykey.length; j++){
      let aday = day[daykey[j]] //특정 날짜의 스케줄 가져옴 ([[1,2],[4,5]])
      //console.log('aday :',daykey[j], aday)
      for(let k=0; k < aday.length; k++){
        if(aday[k].length == 2){
          //console.log(aday[k][0], aday[k][1])
          let adayschedule = aday[k]; //특정 수업시간 가져옴

          let dayjson = {Mon : 0, Tue : 1, Wed : 2, Thu : 3, Fri : 4, Sat : 5, Sun : 6};
          let daynum = dayjson[daykey[j]]; //특정 날짜에 맞는 숫자 가져옴

          //console.log(daynum, adayschedule,idx)

          let today = new Date();
          let todayString = today.toString();
          let todayStringSlice = todayString.slice(0,3)
          

          if(daynum == dayjson[todayStringSlice] && isLecting == 0){
            //console.log(todayStringSlice)
            let hours = today.getHours()
            let currentClassHour = hours - 8
            if(currentClassHour >= adayschedule[0] && currentClassHour <= adayschedule[1]){
              console.log('수업중!!!')
              isLecting = 1;
              document.getElementById('isLecting').innerText = '수업중'
            }
          }
          else if(isLecting==0) {
            document.getElementById('isLecting').innerText = '수업아님'
          }

          let start = [w*4/100 + (w*96/100)*daynum/GRID_X, h*3/100 + (h*97/100)*(adayschedule[0]-1)/GRID_Y];
          let end = [w*4/100 + (w*96/100)*(daynum+1)/GRID_X, h*3/100 + (h*97/100)*(adayschedule[1])/GRID_Y]
          ctx.fillStyle = color[idx];
          ctx.fillRect(start[0], start[1], end[0]-start[0], end[1]-start[1])
          ctx.strokeStyle = ["black","white"][isDarkmode]
          ctx.strokeRect(start[0], start[1], end[0]-start[0], end[1]-start[1])
          
          ctx.stroke()

          ctx.textBaseline = "top"
          ctx.textAlign = "left"
          ctx.font = "900 30px NanumSquare"
          ctx.fillStyle = "white"
          //ctx.fillText(classjson[i].SUBJ_KNM,start[0]+10,start[1]+10)
          let l = drawWrappedTextByCharacter(classjson[i].SUBJ_KNM,start[0]+10,start[1]+10,end[0]-start[0]-20,40)
          
          ctx.font = "500 23px NanumSquare"
          ctx.fillStyle = "white"
          drawWrappedTextByCharacter(classjson[i].SUBJ_CD+'-'+classjson[i].LECT_NUMB,start[0]+10,l+start[1]+10,end[0]-start[0]-20,40)
        }
      }
      
    }
    idx = (idx+1)%color.length
  }
  //console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
}

function deleteFavFromTop(){
  let lect = selectedBuilding+'-'+selectedLect;
  for(let i = 0; i<favList.length; i++){
    if(favList[i].lect == lect){
      favList.splice(i,1);
      break;
    }
  }
}

function loadFavFromList(input){
  let temp = input.innerText;
  
  let buildingtemp = extractBuildingNames(temp);
  let lecttemp = extractRoomNumbers(temp);
  
  selectedBuilding = buildingtemp;
  setSchedule(lecttemp);
}

document.getElementById("switch").addEventListener('change', function(){
    toggleDarkmode(document.getElementById("switch").checked)
 })
 
 function toggleDarkmode(toggle){
      if(toggle){
     isDarkmode = 1;
     

     ctx.fillStyle="#171717";
     ctx.fillRect(0,0,w,h)

     document.getElementById("subjectTitle").style.color = "white"
     document.getElementById("star").style.color = "white"
     document.getElementById("isLecting").style.color = "white"
     
     document.getElementById("tab").style.backgroundColor = "#1e1e1e"
     document.getElementById("building").style.color = "white"
     document.getElementById("building").style.backgroundColor = "#1e1e1e"
     document.getElementById("building").style.borderColor = "#d3d3d3"
     document.getElementById("lect").style.color = "white"
     document.getElementById("lect").style.backgroundColor = "#1e1e1e"
     document.getElementById("lect").style.borderColor = "#d3d3d3"

     document.getElementById("switchText").style.color = "white"

     document.querySelectorAll('.fav').forEach(element => {
    element.style.color = 'white';
    });
    
     setScheduleGrid()
     setSchedule(selectedLect)
     document.body.style.backgroundColor = "#171717"
     localStorage.setItem('isDarkmode',1)
     
   }
   else {
     isDarkmode = 0;

     document.getElementById("subjectTitle").style.color = "black"
     document.getElementById("isLecting").style.color = "black"
     document.getElementById("star").style.color = "black"
     ctx.fillStyle="white";
     ctx.fillRect(0,0,w,h);

     document.getElementById("tab").style.backgroundColor = "#ffffff"
     document.getElementById("building").style.color = "black"
     document.getElementById("building").style.backgroundColor = "#ffffff"
     document.getElementById("building").style.borderColor = "black"
     document.getElementById("lect").style.color = "black"
     document.getElementById("lect").style.backgroundColor = "#ffffff"
     document.getElementById("lect").style.borderColor = "black"
     
     document.getElementById("switchText").style.color = "black"
     
     document.querySelectorAll('.fav').forEach(element => {
    element.style.color = 'black';
       
     })

     setScheduleGrid();
     setSchedule(selectedLect);
     document.body.style.backgroundColor = "white";
     
     localStorage.setItem('isDarkmode',0)
   }
   
   
 }
 
 document.getElementById("star-checkbox").addEventListener('change', function(){
  if(document.getElementById("star-checkbox").checked){
    let temp={
      lect : selectedBuilding+'-'+selectedLect
    }
    favList.push(temp);
    loadFavList()
    
  }
  else {
    deleteFavFromTop()
    loadFavList()
  }
 })

/**검색 기능으로 테스트할때 쓴 직접 입력 후 검색하게 하는 함수*/
// document.getElementById('button').onclick = function(){
//   document.getElementById('schedulelist').innerHTML="";
//   let text = document.getElementById('classroominput').value;
//   //document.getElementById('classroominput').value ="";
//   let schedule = findScheduleOfClassroom(text);
//   let tag = document.getElementById('schedulelist');
//   for(let i = 0; i < schedule.length; i++){
//     let tempsch = schedule[i];
//     let txttemp = tempsch.SUBJ_KNM+'('+tempsch.SUBJ_CD+'-'+tempsch.LECT_NUMB+')';
//     tag.insertAdjacentHTML("beforeend", `<div>${txttemp}</div>`);
//   }
// }

favList = JSON.parse(localStorage.getItem('favList'));
if(favList == null) favList=[]
loadFavList()

isDarkmode = localStorage.getItem('isDarkmode')
if(isDarkmode == null) isDarkmode = 0;
if(isDarkmode == 0) document.getElementById("switch").checked = false;
if(isDarkmode == 1) document.getElementById("switch").checked = true;
toggleDarkmode(document.getElementById("switch").checked)

setBuildingSelect();
setLectureSelect(selectedBuilding)
setScheduleGrid()