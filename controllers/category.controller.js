const asyncWrapper = require("../middleware/asyncWrapper.js");
const Category = require("../models/category.js");

// create a new category
const createCategory = asyncWrapper(async (req, res) => {
  const newData = req.body;
  
  if (req.file) {
    newData.image = req.file.path;
  }

  // check if category already exists
  const existingCategory = await Category.findOne({ name: newData.name });
  if (existingCategory) {
    return res.status(400).json({
      status: "ERROR",
      message: "Category already exists with this name",
    });
  }

  const newCategory = new Category(newData);
  await newCategory.save();
  res.status(201).json({
    status: "SUCESS",
    message: "Category created successfully",
    category: newCategory,
  });
});

// get all categories
const getAllCategories = asyncWrapper(async (req, res) => {
  const categories = await Category.find({}).select("-__v").populate('products');
  res.status(200).json({ success: true, categories: categories });

});

// update category
const updateCategory = asyncWrapper(async (req, res) => {
  const { categoryID } = req.params; // Extract category ID from URL params
  const updatedData = req.body; // Extract updated data from request body

  // If a file is uploaded, add its path to the updated data
  if (req.file) {
    updatedData.image = req.file.path;
  }

  // Check if the category exists
  const existingCategory = await Category.findById(categoryID);
  if (!existingCategory) {
    return res.status(404).json({
      status: "ERROR",
      message: "Category not found",
    });
  }

  // Check if another category already has the same name
  if (updatedData.name) {
    const existingCategoryByName = await Category.findOne({
      name: updatedData.name,
      _id: { $ne: categoryID }, // Exclude the current category from the check
    });

    if (existingCategoryByName) {
      return res.status(400).json({
        status: "ERROR",
        message: "Category already exists with this name",
      });
    }
  }

  // Update the category
  const updatedCategory = await Category.findByIdAndUpdate(
    categoryID,
    updatedData,
    { new: true, runValidators: true } // Return the updated document and run schema validators
  );

  // Send the updated category as a response
  res.status(200).json({
    status: "SUCCESS",
    message: "Category updated successfully",
    data: updatedCategory,
  });
});

// delete category
const deleteCategory = asyncWrapper(async (req, res) => {
  const { categoryID } = req.params; // Extract category ID from URL params

  // Check if the category exists
  const existingCategory = await Category.findById(categoryID);
  if (!existingCategory) {
    return res.status(404).json({
      status: "ERROR",
      message: "Category not found",
    });
  }

  // Delete the category
  await Category.deleteOne({ _id: categoryID });

  // Send a success response
  res.status(200).json({
    status: "SUCCESS",
    message: "Category deleted successfully",
  });
});

const getCategoryByID = asyncWrapper(async (req , res) => {
  const { categoryID } = req.params; // Extract category ID from URL params
  const category = await Category.findById(categoryID).select('-__v').populate('products');
  if (!category) {
    return res.status(404).json({
      status: "ERROR",
      message: "Category not found",
    });
  }
  res.status(200).json({
    status: "SUCCESS",
    message: "Category fetched successfully",
    category: category,
  });
})

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoryByID
};
