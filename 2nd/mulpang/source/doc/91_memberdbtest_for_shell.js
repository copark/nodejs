
// 현재 DB 삭제
db.runCommand({dropDatabase: 1});

// 등록할 회원 정보
var m1 = {name: "kim", age: 20};
var m2 = {name: "lee", age: 20};
var m3 = {name: "admin", age: 35};

// TODO 1. member 컬렉션에 데이터 등록
// insert({등록할 문서})
db.member.insert(m1);
db.member.insert([m2, m3]);

// TODO 2. member 컬렉션 조회
// find()
db.member.find();

// TODO 3. 회원 조회(나이가 20인 회원 조회)
// find({검색조건})
db.member.find({age:20});
db.member.find({age:{ $gt: 20 }});

// TODO 4. 회원 조회(1건)
// findOne()
// db.member.findOne({_id: ObjectId("565cfa5f0cefd86aa424f128")});
db.member.findOne({name: "kim"});

// TODO 5. 회원 수정(kim의 나이 수정)
// update({검색조건}, {수정할 문서})
db.member.update({name: "kim"},{age : 21});
// age만 갱신
db.member.update({name: "kim"},{"$set": {age : 21}});

// 지정 속성을 증가
db.member.update({name: "kim"}, {"$inc": {age: 1}});
db.member.findOne({name: "kim"});

// TODO 6. kim 삭제
// remove({검색 조건})
db.member.remove({name: "kim"});














