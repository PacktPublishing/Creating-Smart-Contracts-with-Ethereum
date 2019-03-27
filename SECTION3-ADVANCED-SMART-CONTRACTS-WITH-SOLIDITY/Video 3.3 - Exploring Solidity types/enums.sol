pragma solidity ^0.4.23;

contract EnumTest {
    enum ActionChoices { 
        GoLeft, 
        GoRight, 
        GoStraight, 
        SitStill 
    }
    
    ActionChoices public choice;
    ActionChoices public constant defaultChoice = ActionChoices.GoStraight;

    function setGoStraight() public {
        choice = ActionChoices.GoStraight;
    }
    
    function setGoLeft() public {
        choice = ActionChoices.GoLeft;
    }
    
    function setGoRight() public {
        choice = ActionChoices.GoRight;
    }
    
    function setSitStill() public {
        choice = ActionChoices.SitStill;
    }

    function getChoice() public view returns (ActionChoices) {
        return choice;
    }

    function getDefaultChoice() public pure returns (uint) {
        return uint(defaultChoice);
    }
}