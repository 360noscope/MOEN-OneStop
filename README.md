# MOEN OneStop

เว็บแอพพลิเคชั่นสำหรับลงทะเบียนข้อมูลเจ้าหน้าที่และระบบจัดการข้อมูลอื่นๆในระบบ IT

## Progress
ความคืบหน้าโดยรวมของโปรเจค

### Version Alpha 1.0
```
* ระบบสามารถเพิ่มข้อมูลเจ้าหน้าที่เข้าไปยัง MariaDB และ server Active Directory ได้โดยตรงแล้ว
* ทำการ format code เพื่อปรับใช้กับ Promise ให้สะดวกต่อการทำ Asynchronous มากขึ้น
* นำตัว Redis server มาใช้เพื่อลด load จะเกิดขึ้นกับ MariaDB ลง ทำให้ดึงข้อมูลมาแสดงได้เร็วขึ้น
* ทำการ debug ส่วน frontend และปรับปรุงการแสดงผลข้อมูลให้มี bug น้อยลง
* ระบบ online บน server แล้วและกำลังทำการทดสอบ
```

### Version Alpha 1.1
```
* เพิ่มระบบการ chat ระหว่าง user
* ปรับการบันทึก session ของระบบไปอยู่ใน redis server
* ปรับระบบการจัดการโปรเซสของเว็บ server เป็น cluster เพื่อการ load balance
```
