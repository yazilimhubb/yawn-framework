cmake_minimum_required(VERSION 3.18)
project(yawn VERSION 0.3.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(yawn src/main.cpp)

target_include_directories(yawn PRIVATE src)

if(WIN32)
  target_link_libraries(yawn PRIVATE ws2_32)
else()
  find_package(Threads REQUIRED)
  target_link_libraries(yawn PRIVATE Threads::Threads)
endif()

if(CMAKE_BUILD_TYPE STREQUAL "Release")
  if(MSVC)
    target_compile_options(yawn PRIVATE /O2 /W3)
  else()
    target_compile_options(yawn PRIVATE -O3 -Wall -Wextra)
    target_link_options(yawn PRIVATE -s)
  endif()
else()
  if(MSVC)
    target_compile_options(yawn PRIVATE /W3)
  else()
    target_compile_options(yawn PRIVATE -Wall -Wextra -g)
  endif()
endif()

install(TARGETS yawn RUNTIME DESTINATION bin)

message(STATUS "yawn ${PROJECT_VERSION}")
message(STATUS "  Build type : ${CMAKE_BUILD_TYPE}")
message(STATUS "  Compiler   : ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "  Standard   : C++${CMAKE_CXX_STANDARD}")
