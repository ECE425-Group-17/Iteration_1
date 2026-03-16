Feature: Invalid Login

  Scenario: User logs in with the wrong password
    Given the browser is open
    When the user goes to the home page
    When the user enters an invalid login email and password
    When the user clicks the login button
    Then a login error message should appear

  Scenario: User tries to log in with blank fields
    Given the browser is open
    When the user goes to the home page
    When the user leaves the login fields blank
    When the user clicks the login button
    Then a login validation message should appear