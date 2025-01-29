import mongoose from "mongoose";
const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
      },
      members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    });
const Room = mongoose.model('Room', roomSchema);
export default Room;
