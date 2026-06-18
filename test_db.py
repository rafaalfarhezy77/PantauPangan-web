import pymysql

conn = pymysql.connect(
    host='gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    port=4000,
    user='YTzpwxsaVCPGBUc.root',
    password='JVam7LiAJKoHMZI0',
    database='pantau-pangan',
    ssl={'ssl': True}
)
with conn.cursor() as cursor:
    cursor.execute('SHOW TABLES')
    tables = cursor.fetchall()
    print('Tables:', tables)
    for t in tables:
        tname = t[0]
        cursor.execute(f'SHOW CREATE TABLE {tname}')
        print(cursor.fetchone()[1])
