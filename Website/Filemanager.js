const fs = require('fs');
const
{
   getCollection,
   LABELS_COLLECTION
} = require('./MongoDBManager.js');

const LoadFilters = async (req, res) => 
{
   const data = await fs.readFile('/Website/WebUi/assets/zopzfiles/onlinefilters.json', 'utf-8');
   const jsonData = JSON.parse(data);
   return res.json(jsonData);
};

const LoadLables = async (req, res) => 
{
  const lables = await getCollection(LABELS_COLLECTION).find().toArray();
  const sanitizedlables = lables.map(({ _id, ...rest }) => rest);
  return res.json(
  {
     success: true,
     message: 'Labels found',
     data: sanitizedlables
  });
};

module.exports = 
{
   LoadFilters,
   LoadLables
};