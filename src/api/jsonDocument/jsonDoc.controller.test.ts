import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { config } from '../../config/environment';
import axios from 'axios';

chai.use(chaiHttp);

const url = `http://localhost:${config.port}`;

describe('Create jsonDoc', function () {

  it('Should create a json', function (done) {
    chai.
      request(url)
      .post('/json/doc')
      .set('Content-Type', 'application/json')
      .send(({
        "_schema": {
          "test": "Hello World"
        }
      }))
      .end((err, res) => {
        if (err) return done(err);

        expect(res).to.have.status(200);
        expect(res.body).to.not.to.be.empty;
        done();
      });
  });

  it('Should fail to create a json', function (done) {
    chai.
      request(url)
      .post('/json/doc')
      .set('Content-Type', 'application/json')
      .send(({}))
      .end((err, res) => {
        if (err) return done(err);

        expect(res).to.have.status(500);
        expect(res.body).to.not.to.be.empty;
        done();
      });
  });

});


describe('Retrieve jsonDoc', function () {

  it('Should return an object', function (done) {

    axios.post(url + '/json/doc', {
      "_schema": {
        "test": "Hello World"
      }
    }).then(({ data }) => {

      chai.
        request(url)
        .get('/json/doc/' + data._id)
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          if (err) return done(err);

          expect(res).to.have.status(200);
          expect(res.body).to.not.to.be.empty;
          done();
        });
    });

  });

  it('Should return 404', function (done) {

    chai.
      request(url)
      .get('/json/doc/1231231231')
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        if (err) return done(err);

        expect(res).to.have.status(404);
        expect(res.body).to.be.empty;
        done();
      });

  });

});


describe('Update jsonDoc', () => {

  it('Should return an object', function (done) {

    axios.post(url + '/json/doc', {
      "_schema": {
        "test": "Hello World"
      }
    }).then(({ data }) => {

      chai.
        request(url)
        .put('/json/doc/' + data._id)
        .send({
          "_schema": {
            "test2": "new Field",
            "test": "updated Field"
          }
        })
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          if (err) return done(err);

          expect(res).to.have.status(200);
          expect(res.body).to.not.to.be.empty;
          expect(res.body._schema).to.contain({
            "test2": "new Field",
            "test": "updated Field"
          });

          done();

        });

    });

  });

  it('Should return 404', (done) => {

    chai.
      request(url)
      .put('/json/doc/ddadsa')
      .send({
        "_schema": {
          "test2": "new Field",
          "test": "updated Field"
        }
      })
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        if (err) return done(err);

        expect(res).to.have.status(404);
        expect(res.body).not.to.be.empty;
        done();

      });
  });

});

describe('Delete jsonDoc', () => {

  it('Should delete jsonDoc', (done) => {

    axios.post(url + '/json/doc', {
      "_schema": {
        "test": "Hello World"
      }
    }).then(({ data }) => {

      chai.
        request(url)
        .delete('/json/doc/' + data._id)
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          if (err) return done(err);

          expect(res).to.have.status(200);
          expect(res.body).to.be.empty;
          done();

        });

    });

  });

  it('Should return 404', (done) => {

    chai.
      request(url)
      .delete('/json/doc/ddadsa')
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        if (err) return done(err);

        expect(res).to.have.status(404);
        expect(res.body).to.be.empty;
        done();

      });
  });

});