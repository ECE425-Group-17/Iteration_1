Feature: Form validation

  Scenario: Empty login form shows validation message
    Given I open the app at "/"
    When I click the element with id "loginBtn"
    Then I should see "Please enter your email and password."

  Scenario: Empty sign up form shows validation message
    Given I open the app at "/signup"
    When I click the element with id "signupBtn"
    Then I should see "Please fill in all sign up fields."

  Scenario: Empty reset form shows validation message
    Given I open the app at "/reset-password"
    When I click the element with id "resetBtn"
    Then I should see "Please enter your email for password reset."