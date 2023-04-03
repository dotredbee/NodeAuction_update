const request = require('supertest')
const app = require('../app')
describe("POST /auth/join test", () => {
    it('should return 403 status code without the csrf token', (done) => {
        request(app)
            .post('/auth/join')
            .send({
                email : "tester@gmail.com",
                nick : "tester",
                password : "tester12345",
                money : 123456
            })
            .expect(403)
            .end((err, res) => {
                if(err) return done(err)
                done()
            })
    })

    it('should return 500 stauts code if send wrong value', (done) => {
        request(app)
            .get('/join')
            .expect(200)
            .end((err, res) => {
                if(err) done(err)
                
                const cookie = res.headers['set-cookie']
                const _csrf = cookie[1].split(';')[0].split('=')[1]
                
                request(app)
                    .post('/auth/join')
                    .set('Cookie', cookie)
                    .send({
                        email : "tester@gmail.com",
                        nick : `<script>alert("hello")</script>`,
                        password : "short",
                        money : "12345",
                        _csrf : _csrf
                    })
                    .expect(500)
                    .end((err, res) => {
                        if(err) return done(err)
                        done()
                    })
            })
    })

    it('should return 302 redirect status code', (done) => {
        request(app)
            .get('/join')
            .expect(200)
            .end((err, res) => {
                if(err) done(err)

                const cookie = res.headers['set-cookie']
                const _csrf = cookie[1].split(';')[0].split('=')[1]
                
                request(app)
                    .post('/auth/join')
                    .set('Cookie', cookie)
                    .send({
                        email : "tester2@gmail.com",
                        nick : "tester2",
                        password : "Tester123@4",
                        money : 1000000,
                        _csrf : _csrf
                    })
                    .expect(302)
                    .end((err, res) => {
                        if(err) return done(err)
                        done()
                    })
            })
    })
})

describe("POST /auth/login", () => {
    it("should return 403 status code without the csrf token", (done) => {
        request(app)
            .post('/auth/login')
            .send({
                email : 'tester2@gmail.com',
                password : 'Tester123@4',
            })
            .expect(403)
            .end((err, res) => {
                if(err) return done(err)
                done()
            })
    })
    it("should return 302 redirect status code", (done) => {
        request(app)
            .get('/')
            .end((err, res) => {
                if(err) done(err)
                
                const cookie = res.headers['set-cookie']
                const _csrf = cookie[1].split(';')[0].split('=')[1]
                
                request(app)
                    .post('/auth/login')
                    .set('Cookie', cookie)
                    .send({
                        email : 'tester2@gmail.com',
                        password : 'Tester123@4',
                        _csrf : _csrf
                    })
                    .expect(302)
                    .end((err, res) => {
                        if(err) return done(err)
                        done() 
                    })
            })
    })
})