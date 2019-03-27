pragma solidity ^0.4.23;

contract JukeBlox {
    struct Song {
        string title;
        string artist;
        uint16 length;   // Length in seconds
        address creator;
        uint256 timestamp;
        bytes swarmHash;
        uint16 reports;
        uint256 queuedCount;
        uint256 index;  // the index of this object in the array.
    }

    struct User {
        string name;
        uint256 addedTs;
    }

    struct Queued {
        Song song;
        uint256 startTime;
        address user;
    }

    // All songs
    Song[] songs;

    // All queued songs
    Queued[] queue;

    mapping(address => User) users;

    address public creator;
    uint256 public maxQueueTime = 3600;  // Max one hour of queued material.
    uint256 public nrSongs = 0;
    uint256 public nrQueued = 0;
    uint256 public maxSongLength = 10 * 60;  // Max ten minutes
    uint256 public minimumQueueValue = 0.001 ether;
    
    constructor() public {
        creator = msg.sender;
        addUser(creator, "Creator");
    }

    /**
     * Add a new permissioned user.
     *
     */
    function addUser(address newUserAddress, string newUserName) onlyUser public {
        require(users[newUserAddress].addedTs == 0);
        User memory user = User(
            newUserName,
            now
        );
        users[newUserAddress] = user;
    }

    modifier onlyUser {
        require(msg.sender == creator || users[msg.sender].addedTs != 0);
        _;
    }

    /**
     * Add a song to the library of songs.
     *
     */
    function addSong(string title, string artist, uint16 length, bytes swarmHash) onlyUser public {
        require(length < maxSongLength);

        Song memory song = Song(
            title,
            artist,
            length,
            msg.sender,
            now,
            swarmHash,
            0,
            0,
            nrSongs
        );
        songs.push(song);

        nrSongs++;
    }

    /**
     * Queue a song from the library in the playlist.
     *
     */
    function queueSong(uint256 index) public /*payable*/ {
        require(songs.length > index);
//        require(msg.value >= minimumQueueValue);

        // Find the next start time for a newly queued item.
        uint256 startTime = now;

        if (queue.length > 0) {
            Queued storage lastQueued = queue[queue.length - 1];
            uint nextTime = lastQueued.startTime + lastQueued.song.length + 1;
            if (nextTime > startTime) {
                startTime = nextTime;
            }

            // We only allow queued up till maxQueueTime seconds.
            if (startTime - now > maxQueueTime) {
                revert();
            }
        }

        Song storage song = songs[index];
        Queued memory queued = Queued(
            song,
            startTime,
            msg.sender
        );
        queue.push(queued);

        nrQueued++;
    }

    /**
     * Get a song from the library.
     *
     */
    function getSong(uint256 index) view public returns(string, string, uint16, bytes) {
        Song storage song = songs[index];
        
        return (song.title, song.artist, song.length, song.swarmHash);
    }

    /**
     * By a given timestamp, get the song playing now, how many seconds into it we are,
     * how long duration it is left and also how many songs are in the queue after the current song.
     *
     * returns: (song queue index, seek seconds, duration, songsQueued)
       By the song queue index we then do `getQueued` to get to the Song.
     *  (0, 0, 0, 0) means no song found for the timestamp
     */
    function getCurrentSong(uint256 timestamp) view public returns (uint256, uint256, uint256, uint256) {

        uint256 songsQueuedCount = 0;
        for (uint256 index = queue.length - 1; index >= 0; index--) {
            Queued storage queued = queue[index];
            if (timestamp >= queued.startTime) {
                if (timestamp < queued.startTime + queued.song.length) {
                    uint256 seek = timestamp - queued.startTime;
                    uint256 duration = queued.song.length - seek;
                    return (index, seek, duration, songsQueuedCount);
                }
                else {
                    break;
                }
            }
            // This song is in front of us in the queue.
            songsQueuedCount++;
        }
        return (0, 0, 0, 0);
    }

    /**
     * Get the Queue object by it's index.
     * This object holds the start time for when the song is meant to start playing.
     */
    function getQueued(uint256 index) view public returns(uint256, uint256) {
        Queued storage queued = queue[index];
        return (queued.startTime, queued.song.index);
    }
}
