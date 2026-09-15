const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../controllers/analyticsController.js');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `{
        $unwind: {
          path: "$terms",
          preserveNullAndEmptyArrays: true
        }
      },`;

const replacementStr = `{
        $unwind: {
          path: "$terms",
          preserveNullAndEmptyArrays: true
        }
      },
      // Deduplicate subject marks within each term (keep first occurrence)
      {
        $addFields: {
          "terms.marks": {
            $reduce: {
              input: { $ifNull: ["$terms.marks", []] },
              initialValue: [],
              in: {
                $cond: [
                  { $in: ["$$this.subject", "$$value.subject"] },
                  "$$value",
                  { $concatArrays: ["$$value", ["$$this"]] }
                ]
              }
            }
          }
        }
      },`;

const targetStrFalse = `{ $unwind: { path: "$terms", preserveNullAndEmptyArrays: false } },`;

const replacementStrFalse = `{ $unwind: { path: "$terms", preserveNullAndEmptyArrays: false } },
      // Deduplicate subject marks within each term (keep first occurrence)
      {
        $addFields: {
          "terms.marks": {
            $reduce: {
              input: { $ifNull: ["$terms.marks", []] },
              initialValue: [],
              in: {
                $cond: [
                  { $in: ["$$this.subject", "$$value.subject"] },
                  "$$value",
                  { $concatArrays: ["$$value", ["$$this"]] }
                ]
              }
            }
          }
        }
      },`;

content = content.split(targetStr).join(replacementStr);
content = content.split(targetStrFalse).join(replacementStrFalse);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced successfully.');
