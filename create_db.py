import pymysql
try:
    conn = pymysql.connect(
        host='gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
        port=4000,
        user='YTzpwxsaVCPGBUc.root',
        password='JVam7LiAJKoHMZI0',
        ssl={'ssl': True}
    )
    with conn.cursor() as cursor:
        cursor.execute('CREATE DATABASE IF NOT EXISTS pantau_pangan_laravel')
    conn.commit()
    print('SUCCESS_DB_CREATED')
except Exception as e:
    print('ERROR:', str(e))
