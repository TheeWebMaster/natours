const catchAsync = require('../errors/catchAsync');
const AppError = require('../errors/appError');

const createOne = Model =>
  catchAsync(async (req, res) => {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { document },
    });
  });

const updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const updatedDoc = await Model.findOneAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedDoc) {
      return next(new AppError(`document not found with id ${req.params.id}`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: { document: updatedDoc },
    });
  });

const deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError(`document not found with id ${req.params.id}`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

module.exports = { createOne, updateOne, deleteOne };
