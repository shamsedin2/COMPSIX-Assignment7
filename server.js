// Import required packages
require('dotenv').config();
const express = require('express');
const { sequelize, Track } = require('./database/setup');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Connect to database when server starts
sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection established.');
    })
    .catch(err => {
        console.error('❌ Unable to connect to database:', err);
    });


app.get('/api/tracks', async (req, res) => {
    try {
        // Find all tracks in the database
        const tracks = await Track.findAll();
        
        res.status(200).json({
            message: 'success',
            count: tracks.length,
            data: tracks
        });
    } catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(500).json({
            error: 'Failed to retrieve tracks',
            details: error.message
        });
    }
});

// GET /api/tracks/:id - Get a single track by ID
app.get('/api/tracks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find track by primary key (trackId)
        const track = await Track.findByPk(id);
        
        // Check if track exists
        if (!track) {
            return res.status(404).json({
                error: 'Track not found',
                message: `No track found with ID ${id}`
            });
        }
        
        res.status(200).json({
            message: 'success',
            data: track
        });
    } catch (error) {
        console.error('Error fetching track:', error);
        res.status(500).json({
            error: 'Failed to retrieve track',
            details: error.message
        });
    }
});

// POST /api/tracks - Create a new track
app.post('/api/tracks', async (req, res) => {
    try {
        const { songTitle, artistName, albumName, genre, duration, releaseYear } = req.body;
        
        // Validate required fields
        if (!songTitle || !artistName || !albumName || !genre || !duration || !releaseYear) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['songTitle', 'artistName', 'albumName', 'genre', 'duration', 'releaseYear'],
                received: req.body
            });
        }
        
        // Create new track using Sequelize
        const newTrack = await Track.create({
            songTitle,
            artistName,
            albumName,
            genre,
            duration: parseInt(duration),
            releaseYear: parseInt(releaseYear)
        });
        
        res.status(201).json({
            message: 'Track created successfully',
            data: newTrack
        });
    } catch (error) {
        console.error('Error creating track:', error);
        
        // Handle validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }
        
        res.status(500).json({
            error: 'Failed to create track',
            details: error.message
        });
    }
});

// PUT /api/tracks/:id - Update an existing track
app.put('/api/tracks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { songTitle, artistName, albumName, genre, duration, releaseYear } = req.body;
        
        // Find the track first
        const track = await Track.findByPk(id);
        
        // Check if track exists
        if (!track) {
            return res.status(404).json({
                error: 'Track not found',
                message: `No track found with ID ${id}`
            });
        }
        
        // Validate required fields
        if (!songTitle || !artistName || !albumName || !genre || !duration || !releaseYear) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['songTitle', 'artistName', 'albumName', 'genre', 'duration', 'releaseYear']
            });
        }
        
        // Update the track
        await track.update({
            songTitle,
            artistName,
            albumName,
            genre,
            duration: parseInt(duration),
            releaseYear: parseInt(releaseYear)
        });
        
        res.status(200).json({
            message: 'Track updated successfully',
            data: track
        });
    } catch (error) {
        console.error('Error updating track:', error);
        
        // Handle validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }
        
        res.status(500).json({
            error: 'Failed to update track',
            details: error.message
        });
    }
});

// DELETE /api/tracks/:id - Delete a track
app.delete('/api/tracks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the track first
        const track = await Track.findByPk(id);
        
        // Check if track exists
        if (!track) {
            return res.status(404).json({
                error: 'Track not found',
                message: `No track found with ID ${id}`
            });
        }
        
        // Store track data before deletion for response
        const deletedTrackData = {
            trackId: track.trackId,
            songTitle: track.songTitle,
            artistName: track.artistName
        };
        
        // Delete the track using destroy method
        await track.destroy();
        
        res.status(200).json({
            message: 'Track deleted successfully',
            data: deletedTrackData
        });
    } catch (error) {
        console.error('Error deleting track:', error);
        res.status(500).json({
            error: 'Failed to delete track',
            details: error.message
        });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`\n🎵 Music Library API Server`);
    console.log(`================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Endpoints:`);
    console.log(`   GET    /api/tracks       - Get all tracks`);
    console.log(`   GET    /api/tracks/:id   - Get track by ID`);
    console.log(`   POST   /api/tracks       - Create new track`);
    console.log(`   PUT    /api/tracks/:id   - Update track`);
    console.log(`   DELETE /api/tracks/:id   - Delete track`);
    console.log(`================================\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n  Shutting down gracefully...');
    await sequelize.close();
    console.log(' Database connection closed.');
    process.exit(0);
});
// Import required packages
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './music_library.db',
    logging: false // Set to console.log to see SQL queries
});

// Define Track Model
const Track = sequelize.define('Track', {
    trackId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    songTitle: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Song title cannot be empty'
            }
        }
    },
    artistName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Artist name cannot be empty'
            }
        }
    },
    albumName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Album name cannot be empty'
            }
        }
    },
    genre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Genre cannot be empty'
            }
        }
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: {
                msg: 'Duration must be an integer'
            },
            min: {
                args: [1],
                msg: 'Duration must be at least 1 second'
            }
        }
    },
    releaseYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: {
                msg: 'Release year must be an integer'
            },
            min: {
                args: [1900],
                msg: 'Release year must be 1900 or later'
            },
            max: {
                args: [new Date().getFullYear()],
                msg: 'Release year cannot be in the future'
            }
        }
    }
}, {
    tableName: 'tracks',
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Asynchronous function to initialize the database
async function initializeDatabase() {
    try {
        // Test the database connection
        await sequelize.authenticate();
        console.log(' Database connection established successfully.');

        // Synchronize the model with the database
        // This creates the table if it doesn't exist
        await sequelize.sync({ force: false });
        console.log(' Database tables synchronized successfully.');

        // Close the connection
        await sequelize.close();
        console.log('  Database connection closed.');
        console.log('\n🎵 Music library database is ready!');

    } catch (error) {
        console.error(' Unable to connect to the database:', error);
        process.exit(1);
    }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
    initializeDatabase();
}

// Export sequelize instance and Track model for use in other files
module.exports = { sequelize, Track };

