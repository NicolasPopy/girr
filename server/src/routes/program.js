"use strict";
const express = require('express')
const router = express.Router()
const logger = require('../logger')
const Program = require('../models/program')
const path = require('path')
const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'data/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, path.basename(file.originalname, path.extname(file.originalname)).replace(/\s/g, "_") + '-' + Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage })

/**
 * @swagger
 * definitions:
 *   Program:
 *     properties:
 *       name:
 *         type: string
 *         description: a name to identify the Program between others
 *         required: true
 *       thumbnail:
 *         type: string
 *         description: thumbnail uri
 */

router.route('/')
    /**
     * @swagger
     * /programs:
     *   get:
     *     tags:
     *       - Programs
     *     description: Return all programs
     *     summary: Get all programs
     *     produces: application/json
     *     responses:
     *       200:
     *         description: An array of programs
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Program'
     */
    .get((req, res) => {
        Program.find((err, programs) => {
            res.send(programs)
        })
    })
    /**
     * @swagger
     * /programs:
     *   post:
     *     tags:
     *       - Programs
     *     description: Create a new program
     *     summary: Add a new one
     *     produces: application/json
     *     parameters:
     *       - name: program
     *         in: body
     *         description: Fields for the Program resource
     *         schema:
     *           type: array
     *           $ref: '#/definitions/Program'
     *     responses:
     *       200:
     *         description: Successfully created
     *         schema:
     *           $ref: '#/definitions/Program'
     */
    .post(function(req, res, next) {
        let program = new Program(Object.assign({name: "New Program at " + (new Date()).toLocaleTimeString()}, req.body, {created: Date.now(), modified: Date.now()}));
        program.save()
          .then(function(program) {
            logger.debug("Add a new Program " + program.toString())
            res.json(program)
          })
          .catch(function(error) {
            next(error)
          })
    });

// Middleware : we check if the program exists in the DB before going further
router.param('programId', function (req, res, next, value, name) {
  Program
    .findOne({_id: value})
    .populate('episodes')
    .then(function(program) {
      if (program !== null) {
        logger.debug("Found " + program.toString())
        req.program = program
        next()
      } else {
        next({message:"Program " + value + " was not found", status: 404})
      }
    })
    .catch(function(error) {
      next(error)
    })
})

router.route('/:programId')
  /**
   * @swagger
   * /programs/{id}:
   *   get:
   *     tags:
   *       - Programs
   *     description: Return a single program
   *     summary: Get a program
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: id
   *         description: Program's id
   *         in: path
   *         required: true
   *         type: uuid
   *     responses:
   *       200:
   *         description: A single Program
   *         schema:
   *           $ref: '#/definitions/Program'
   */
  .get(function (req, res, next) {
    res.send(req.program)
  })
  /**
   * @swagger
   * /programs/{id}:
   *   put:
   *     tags:
   *       - Programs
   *     description: Update a single program
   *     summary: Edit a program
   *     produces: application/json
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - name: id
   *         description: Program's id
   *         in: path
   *         required: true
   *         type: uuid
   *       - name: program
   *         in: body
   *         description: Fields for the Program resource
   *         schema:
   *           type: array
   *           $ref: '#/definitions/Program'
   *     responses:
   *       200:
   *         description: Successfully updated
   *         schema:
   *           $ref: '#/definitions/Program'
   */
  .put(upload.single('thumbnail'), function (req, res, next) {
    if (req.file) {
      logger.debug('Receive a file : ')
      logger.debug(req.file)
      req.body.thumbnail = '/' + req.file.path
    }

    Program
      // use findOneAndUpdate to get the new result (even if we already found the resource in the DB)
      .findByIdAndUpdate(req.program._id, Object.assign(req.body, {modified: Date.now()}), {new : true})
      .then(function(program) {
        if (program !== null) {
          logger.debug("Updated " + program.toString())
          res.json(program)
        } else {
          next({message:"Program " + req.program.name + " wasn't updated", status: 417})
        }
      })
      .catch(function(error) {
        next(error)
      })
  })
  /**
   * @swagger
   * /programs/{id}:
   *   delete:
   *     tags:
   *       - Programs
   *     description: Delete a single program
   *     summary: Remove a program
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: id
   *         description: Program's id
   *         in: path
   *         required: true
   *         type: uuid
   *     responses:
   *       204:
   *         description: Successfully deleted
   */
  .delete(function (req, res, next) {
    req.program
      .remove()
      .then(function(result) {
        if (result !== null) {
          logger.debug("Removed Program " + req.params.programId)
          res.status(204).json(result.toString())
        } else {
          next({message:"Program " + req.params.programId + " wasn't deleted", status: 417})
        }
      })
      .catch(function(error) {
        next(error)
      })
  })

router.use('/:programId/episodes', require('./episode'));

module.exports = router;