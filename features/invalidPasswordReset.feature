Feature: Invalid Password Reset

  Scenario: User tries password reset with blank email
    Given the browser is open
    When the user goes to the home page
    When the user leaves the reset email field blank
    When the user clicks the reset button
    Then a reset validation message should appear